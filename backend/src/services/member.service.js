import mongoose from 'mongoose'
import User from '../models/User.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import { ApiError } from '../utils/apiError.js'

async function ensureManager(projectId, userId, role) {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, 'Invalid project id')

  const project = await Project.findById(projectId).lean()
  if (!project) throw new ApiError(404, 'Project not found')

  if (role !== 'ADMINISTRATOR' && String(project.ownerId) !== String(userId)) {
    throw new ApiError(403, 'Only the project owner or administrator can manage members')
  }

  return project
}

export async function listMembers(projectId, userId, role) {
  await ensureManager(projectId, userId, role)

  return ProjectMember.find({ projectId })
    .populate('userId', 'name email role status')
    .sort({ createdAt: 1 })
    .lean()
}

export async function addMember(projectId, userId, role, memberUserId) {
  await ensureManager(projectId, userId, role)

  if (!mongoose.isValidObjectId(memberUserId)) throw new ApiError(400, 'Invalid member id')

  const member = await User.findById(memberUserId).lean()
  if (!member || member.status !== 'ACTIVE') throw new ApiError(404, 'User not found or inactive')

  await ProjectMember.create({ projectId, userId: memberUserId })
  return member
}
