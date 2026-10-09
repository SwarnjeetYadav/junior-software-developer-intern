import mongoose from 'mongoose'
import Task from '../models/Task.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import ActivityLog from '../models/ActivityLog.js'
import { createNotification } from './notification.service.js'
import { ApiError } from '../utils/apiError.js'
import { isValidPriority, isValidStatus } from '../utils/taskRules.js'
import { suggestAssignee, suggestAssignees } from './assignment.service.js'
import TaskDependency from '../models/TaskDependency.js'
import { getBlockingPredecessors, notifySuccessorsIfUnblocked } from './dependency.service.js'

export async function ensureProjectAccess(projectId, userId, role) {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, 'Invalid project id')

  const project = await Project.findById(projectId)
  if (!project) throw new ApiError(404, 'Project not found')

  if (role === 'ADMINISTRATOR' || String(project.ownerId) === String(userId)) return { project, member: null }

  const member = await ProjectMember.findOne({ projectId, userId }).lean()
  if (!member) throw new ApiError(403, 'You are not a member of this project')
  return { project, member }
}

function parseEstimate(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 5 || parsed > 43200) throw new ApiError(400, 'Estimate must be between 5 and 43200 minutes')
  return parsed
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

  const estimateMinutes = parseEstimate(payload.estimateMinutes)
  const members = await ProjectMember.find({ projectId }).select('userId projectRole').lean()
  const memberRoles = new Map(members.map((member) => [String(member.userId), member.projectRole || 'MEMBER']))
  let assigneeId = payload.assigneeId || null

  if (assigneeId && !memberRoles.has(String(assigneeId))) {
    throw new ApiError(422, 'Assignee is not a member of this project')
  }
  if (assigneeId && memberRoles.get(String(assigneeId)) === 'VIEWER') {
    throw new ApiError(422, 'Viewers cannot be assigned tasks')
  }

  if (!assigneeId) {
    assigneeId = await suggestAssignee(projectId, { priority, dueDate, estimateMinutes })
  }

  const task = await Task.create({
    projectId: project._id,
    title,
    description: payload.description?.trim() || '',
    priority,
    status: 'TODO',
    assigneeId,
    dueDate,
    estimateMinutes,
    createdBy: userId,
  })

  await ActivityLog.create({
    userId,
    action: 'TASK_CREATED',
    entityType: 'TASK',
    entityId: task._id,
    metadata: { projectId: project._id, assigneeId, priority, dueDate, estimateMinutes },
  })

  if (assigneeId) {
    await createNotification({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      message: 'A new task was assigned to you: ' + task.title,
      entityId: task._id,
    })
  }

  return task
}

export async function getAssignmentSuggestions({ userId, role, taskId }) {
  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(400, 'Invalid task id')
  const task = await Task.findById(taskId).lean()
  if (!task) throw new ApiError(404, 'Task not found')
  await ensureProjectAccess(task.projectId, userId, role)

  return suggestAssignees({
    projectId: task.projectId,
    priority: task.priority,
    dueDate: task.dueDate,
    estimateMinutes: task.estimateMinutes,
  })
}

export async function listTasks({ userId, role, projectId, query = {} }) {
  await ensureProjectAccess(projectId, userId, role)

  const filter = { projectId }
  if (query.status && isValidStatus(query.status)) filter.status = query.status
  if (query.priority && isValidPriority(query.priority)) filter.priority = query.priority
  if (query.assigneeId && mongoose.isValidObjectId(query.assigneeId)) filter.assigneeId = query.assigneeId

  const [tasks, dependencies] = await Promise.all([
    Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate('assigneeId', 'name email role')
      .lean(),
    TaskDependency.find({ projectId }).select('predecessorTaskId successorTaskId').lean(),
  ])

  const dependencyMap = new Map()
  for (const edge of dependencies) {
    const predecessor = String(edge.predecessorTaskId)
    const successor = String(edge.successorTaskId)
    const predecessorEntry = dependencyMap.get(predecessor) || { blockedBy: [], blocks: [] }
    const successorEntry = dependencyMap.get(successor) || { blockedBy: [], blocks: [] }
    predecessorEntry.blocks.push(successor)
    successorEntry.blockedBy.push(predecessor)
    dependencyMap.set(predecessor, predecessorEntry)
    dependencyMap.set(successor, successorEntry)
  }

  return tasks.map((task) => {
    const dependency = dependencyMap.get(String(task._id)) || { blockedBy: [], blocks: [] }
    return {
      ...task,
      dependencyCount: dependency.blockedBy.length + dependency.blocks.length,
      blockedByCount: dependency.blockedBy.length,
      blockingCount: dependency.blocks.length,
      blockedByTaskIds: dependency.blockedBy,
      blockingTaskIds: dependency.blocks,
      hasBlockingDependencies: dependency.blockedBy.length > 0,
    }
  })
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
  const estimateMinutes = payload.estimateMinutes !== undefined ? parseEstimate(payload.estimateMinutes) : undefined

  if (payload.assigneeId) {
    const member = await ProjectMember.findOne({ projectId: task.projectId, userId: payload.assigneeId }).lean()
    if (!member) throw new ApiError(422, 'Assignee is not a member of this project')
    if (member.projectRole === 'VIEWER') throw new ApiError(422, 'Viewers cannot be assigned tasks')
  }

  if (payload.status && ['IN_PROGRESS', 'REVIEW', 'COMPLETED'].includes(payload.status)) {
    const blockers = await getBlockingPredecessors(task._id)
    if (blockers.length) {
      throw new ApiError(409, 'Task is blocked by: ' + blockers.slice(0, 3).map((item) => item.title).join(', '))
    }
  }

  const changes = {}
  if (payload.title !== undefined && payload.title.trim() !== task.title) changes.title = { from: task.title, to: payload.title.trim() }
  if (payload.description !== undefined && payload.description.trim() !== task.description) changes.description = { from: task.description, to: payload.description.trim() }
  if (payload.status && payload.status !== task.status) changes.status = { from: task.status, to: payload.status }
  if (payload.priority && payload.priority !== task.priority) changes.priority = { from: task.priority, to: payload.priority }
  if (payload.assigneeId !== undefined && String(payload.assigneeId || '') !== String(task.assigneeId || '')) changes.assigneeId = { from: task.assigneeId, to: payload.assigneeId || null }
  if (payload.estimateMinutes !== undefined && payload.estimateMinutes !== task.estimateMinutes) changes.estimateMinutes = { from: task.estimateMinutes, to: estimateMinutes }

  if (payload.dueDate !== undefined) {
    const parsed = payload.dueDate ? new Date(payload.dueDate) : null
    if (payload.dueDate && Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Invalid due date')
    const before = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : null
    const after = parsed ? parsed.toISOString().slice(0, 10) : null
    if (before !== after) changes.dueDate = { from: task.dueDate, to: parsed }
    task.dueDate = parsed
  }

  if (payload.title !== undefined) task.title = payload.title.trim()
  if (payload.description !== undefined) task.description = payload.description.trim()
  if (payload.status) task.status = payload.status
  if (payload.priority) task.priority = payload.priority
  if (payload.assigneeId !== undefined) task.assigneeId = payload.assigneeId || null
  if (estimateMinutes !== undefined) task.estimateMinutes = estimateMinutes

  if (payload.status === 'IN_PROGRESS' && !task.startedAt) task.startedAt = new Date()
  if (payload.status === 'COMPLETED') {
    if (!task.startedAt) task.startedAt = task.createdAt || new Date()
    task.completedAt = new Date()
  } else if (payload.status && payload.status !== 'COMPLETED') {
    task.completedAt = null
  }

  await task.save()

  for (const [field, change] of Object.entries(changes)) {
    const action = field === 'status'
      ? 'TASK_STATUS_CHANGED'
      : field === 'priority'
        ? 'TASK_PRIORITY_CHANGED'
        : field === 'assigneeId'
          ? 'TASK_ASSIGNEE_CHANGED'
          : field === 'dueDate'
            ? 'TASK_DUE_DATE_CHANGED'
            : 'TASK_UPDATED'

    await ActivityLog.create({
      userId,
      action,
      entityType: 'TASK',
      entityId: task._id,
      metadata: { field, ...change },
    })
  }

  if (changes.assigneeId?.to) {
    await createNotification({
      userId: changes.assigneeId.to,
      type: 'TASK_ASSIGNED',
      message: 'You are now assigned to: ' + task.title,
      entityId: task._id,
    })
  }

  if (changes.status?.to === 'COMPLETED') await notifySuccessorsIfUnblocked(task._id)

  return task
}
