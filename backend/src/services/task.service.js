import mongoose from 'mongoose'
import Task from '../models/Task.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import ActivityLog from '../models/ActivityLog.js'
import Notification from '../models/Notification.js'
import { ApiError } from '../utils/apiError.js'
import { isValidPriority, isValidStatus } from '../utils/taskRules.js'
import { suggestAssignee } from './assignment.service.js'

async function ensureProjectAccess(projectId, userId, role) {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, 'Invalid project id')

  const project = await Project.findById(projectId)
  if (!project) throw new ApiError(404, 'Project not found')

  if (role === 'ADMINISTRATOR' || String(project.ownerId) === String(userId)) return { project, member: null }

  const member = await ProjectMember.findOne({ projectId, userId }).lean()
  if (!member) throw new ApiError(403, 'You are not a member of this project')
  return { project, member }
}

export async function createTask({ userId, role, projectId, payload }) {
  const access = await ensureProjectAccess(projectId, userId, role)
  const project = access.project
  if (access.member?.projectRole === 'VIEWER') throw new ApiError(403, 'Viewers have read-only project access')
  const title = payload?.title?.trim()

  if (!title) throw new ApiError(400, 'Task title is required')
  if (title.length > 180) throw new ApiError(400, 'Task title is too long')

  const priority = payload.priority || 'MEDIUM'
  if (!isValidPriority(priority)) throw new ApiError(400, 'Invalid task priority')

  const dueDate = payload.dueDate ? new Date(payload.dueDate) : null
  if (payload.dueDate && Number.isNaN(dueDate.getTime())) throw new ApiError(400, 'Invalid due date')

  const members = await ProjectMember.find({ projectId }).select('userId').lean()
  const eligible = new Set(members.map((member) => String(member.userId)))
  let assigneeId = payload.assigneeId || null

  if (assigneeId && !eligible.has(String(assigneeId))) {
    throw new ApiError(422, 'Assignee is not a member of this project')
  }

  if (!assigneeId) assigneeId = await suggestAssignee(projectId)

  const task = await Task.create({
    projectId: project._id,
    title,
    description: payload.description?.trim() || '',
    priority,
    status: 'TODO',
    assigneeId,
    dueDate,
    createdBy: userId,
  })

  await ActivityLog.create({
    userId,
    action: 'TASK_CREATED',
    entityType: 'TASK',
    entityId: task._id,
    metadata: { projectId: project._id, assigneeId },
  })

  if (assigneeId) {
    await Notification.create({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      message: `A new task was assigned to you: ${task.title}`,
      entityId: task._id,
    })
  }

  return task
}

export async function listTasks({ userId, role, projectId, query = {} }) {
  await ensureProjectAccess(projectId, userId, role)

  const filter = { projectId }
  if (query.status && isValidStatus(query.status)) filter.status = query.status
  if (query.priority && isValidPriority(query.priority)) filter.priority = query.priority
  if (query.assigneeId && mongoose.isValidObjectId(query.assigneeId)) filter.assigneeId = query.assigneeId

  return Task.find(filter)
    .sort({ dueDate: 1, createdAt: -1 })
    .populate('assigneeId', 'name email role')
    .lean()
}

export async function updateTask({ userId, role, taskId, payload }) {
  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(400, 'Invalid task id')

  const task = await Task.findById(taskId)
  if (!task) throw new ApiError(404, 'Task not found')

  const access = await ensureProjectAccess(task.projectId, userId, role)
  if (access.member?.projectRole === 'VIEWER') throw new ApiError(403, 'Viewers have read-only project access')

  if (payload.status && !isValidStatus(payload.status)) throw new ApiError(400, 'Invalid task status')
  if (payload.priority && !isValidPriority(payload.priority)) throw new ApiError(400, 'Invalid task priority')
  if (payload.title !== undefined && !payload.title?.trim()) throw new ApiError(400, 'Task title cannot be empty')

  if (payload.assigneeId) {
    const member = await ProjectMember.findOne({ projectId: task.projectId, userId: payload.assigneeId }).lean()
    if (!member) throw new ApiError(422, 'Assignee is not a member of this project')
  }

  if (payload.dueDate) {
    const parsed = new Date(payload.dueDate)
    if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Invalid due date')
    task.dueDate = parsed
  } else if (payload.dueDate === null || payload.dueDate === '') {
    task.dueDate = null
  }

  if (payload.title !== undefined) task.title = payload.title.trim()
  if (payload.description !== undefined) task.description = payload.description.trim()
  if (payload.status) task.status = payload.status
  if (payload.priority) task.priority = payload.priority
  if (payload.assigneeId !== undefined) task.assigneeId = payload.assigneeId || null

  await task.save()

  await ActivityLog.create({
    userId,
    action: 'TASK_UPDATED',
    entityType: 'TASK',
    entityId: task._id,
    metadata: { changes: Object.keys(payload) },
  })

  return task
}
