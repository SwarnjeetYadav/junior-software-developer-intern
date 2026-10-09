import mongoose from 'mongoose'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import ProjectMessage from '../models/ProjectMessage.js'
import Task from '../models/Task.js'
import ActivityLog from '../models/ActivityLog.js'
import Notification from '../models/Notification.js'
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

async function validateContext({ projectId, userId, replyToId, taskId, mentions }) {
  if (replyToId) {
    if (!mongoose.isValidObjectId(replyToId)) throw new ApiError(400, 'Invalid reply message id')
    const reply = await ProjectMessage.findOne({ _id: replyToId, projectId }).lean()
    if (!reply) throw new ApiError(422, 'Reply target does not belong to this project')
  }

  if (taskId) {
    if (!mongoose.isValidObjectId(taskId)) throw new ApiError(400, 'Invalid task id')
    const task = await Task.findOne({ _id: taskId, projectId }).lean()
    if (!task) throw new ApiError(422, 'Task context does not belong to this project')
  }

  const memberIds = await ProjectMember.find({ projectId }).distinct('userId')
  const validMentionIds = (mentions || [])
    .filter((id) => mongoose.isValidObjectId(id))
    .map(String)
    .filter((id, index, list) => list.indexOf(id) === index)
    .filter((id) => memberIds.some((memberId) => String(memberId) === id))
    .slice(0, 10)

  return validMentionIds
}

export async function listProjectMessages({ projectId, userId, role, limit = 100 }) {
  await ensureProjectMember(projectId, userId, role)
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100)

  return ProjectMessage.find({ projectId })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('userId', 'name email role')
    .populate('replyToId', 'userId message createdAt')
    .populate('mentions', 'name email')
    .populate('taskId', 'title status priority')
    .lean()
    .then((messages) => messages.reverse())
}

export async function sendProjectMessage({ projectId, userId, role, message, replyToId = null, taskId = null, mentions = [] }) {
  const project = await ensureProjectMember(projectId, userId, role)

  const cleanMessage = message?.trim()
  if (!cleanMessage) throw new ApiError(400, 'Chat message is required')
  if (cleanMessage.length > 2000) throw new ApiError(400, 'Chat message is too long')

  const validMentions = await validateContext({ projectId: project._id, userId, replyToId, taskId, mentions })

  const created = await ProjectMessage.create({
    projectId: project._id,
    userId,
    message: cleanMessage,
    replyToId: replyToId || null,
    taskId: taskId || null,
    mentions: validMentions,
    reactions: [],
  })

  await ActivityLog.create({
    userId,
    action: 'PROJECT_CHAT_MESSAGE',
    entityType: 'PROJECT',
    entityId: project._id,
    metadata: { messageId: created._id, taskId: taskId || null, replyToId: replyToId || null, mentions: validMentions },
  })

  if (validMentions.length) {
    const recipients = validMentions.filter((id) => String(id) !== String(userId))
    if (recipients.length) {
      await Notification.insertMany(recipients.map((recipientId) => ({
        userId: recipientId,
        type: 'PROJECT_CHAT_MENTION',
        message: 'You were mentioned in ' + project.name + ' team chat.',
        entityId: project._id,
      })))
    }
  }

  return ProjectMessage.findById(created._id)
    .populate('userId', 'name email role')
    .populate('replyToId', 'userId message createdAt')
    .populate('mentions', 'name email')
    .populate('taskId', 'title status priority')
    .lean()
}

export async function toggleProjectMessageReaction({ projectId, messageId, userId, role, emoji }) {
  await ensureProjectMember(projectId, userId, role)
  if (!mongoose.isValidObjectId(messageId)) throw new ApiError(400, 'Invalid message id')
  if (!['👍', '❤️', '✅', '👀', '🚀'].includes(emoji)) throw new ApiError(400, 'Unsupported reaction')

  const message = await ProjectMessage.findOne({ _id: messageId, projectId })
  if (!message) throw new ApiError(404, 'Message not found')

  const existingIndex = message.reactions.findIndex((item) => String(item.userId) === String(userId) && item.emoji === emoji)
  if (existingIndex >= 0) message.reactions.splice(existingIndex, 1)
  else {
    message.reactions.push({ userId, emoji })
  }

  await message.save()
  return ProjectMessage.findById(message._id)
    .populate('userId', 'name email role')
    .populate('replyToId', 'userId message createdAt')
    .populate('mentions', 'name email')
    .populate('taskId', 'title status priority')
    .lean()
}
