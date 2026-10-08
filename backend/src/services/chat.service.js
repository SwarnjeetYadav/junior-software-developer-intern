import mongoose from 'mongoose'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import ProjectMessage from '../models/ProjectMessage.js'
import ActivityLog from '../models/ActivityLog.js'
import { ApiError } from '../utils/apiError.js'

async function ensureProjectMember(projectId, userId, role) {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, 'Invalid project id')

  const project = await Project.findById(projectId).lean()
  if (!project) throw new ApiError(404, 'Project not found')
  if (role === 'ADMINISTRATOR' || String(project.ownerId) === String(userId)) return project

  const member = await ProjectMember.exists({ projectId, userId })
  if (!member) throw new ApiError(403, 'You are not a member of this project')

  return project
}

export async function listProjectMessages({ projectId, userId, role }) {
  await ensureProjectMember(projectId, userId, role)

  return ProjectMessage.find({ projectId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('userId', 'name email role')
    .lean()
    .then((messages) => messages.reverse())
}

export async function sendProjectMessage({ projectId, userId, role, message }) {
  const project = await ensureProjectMember(projectId, userId, role)

  const cleanMessage = message?.trim()
  if (!cleanMessage) throw new ApiError(400, 'Chat message is required')
  if (cleanMessage.length > 2000) throw new ApiError(400, 'Chat message is too long')

  const created = await ProjectMessage.create({
    projectId: project._id,
    userId,
    message: cleanMessage,
  })

  await ActivityLog.create({
    userId,
    action: 'PROJECT_CHAT_MESSAGE',
    entityType: 'PROJECT',
    entityId: project._id,
    metadata: { messageId: created._id },
  })

  return ProjectMessage.findById(created._id)
    .populate('userId', 'name email role')
    .lean()
}
