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
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(400, 'Invalid project id')

  const project = await Project.findById(projectId).lean()
  if (!project) throw new ApiError(404, 'Project not found')

  if (role !== 'ADMINISTRATOR' && String(project.ownerId) !== String(userId)) {
    const member = await ProjectMember.exists({ projectId, userId })
    if (!member) throw new ApiError(403, 'You are not a member of this project')
  }

  return ProjectMember.find({ projectId })
    .populate('userId', 'name email role status')
    .sort({ createdAt: 1 })
    .lean()
}

export async function searchMemberCandidates(projectId, userId, role, query = '') {
  await ensureManager(projectId, userId, role)

  const term = query.trim()
  if (term.length < 2) return []

  const existingIds = await ProjectMember.find({ projectId }).distinct('userId')
  const safeTerm = term.replace(/[.*+?^()|[\]\\]/g, '\\$&')
  const matcher = new RegExp(safeTerm, 'i')

  return User.find({
    status: 'ACTIVE',
    _id: { $nin: existingIds },
    $or: [{ name: matcher }, { email: matcher }],
  })
    .select('name email role status')
    .sort({ name: 1 })
    .limit(10)
    .lean()
}

export async function addMember(projectId, userId, role, memberUserId) {
  await ensureManager(projectId, userId, role)

  if (!mongoose.isValidObjectId(memberUserId)) throw new ApiError(400, 'Invalid member id')

  const member = await User.findById(memberUserId).lean()
  if (!member || member.status !== 'ACTIVE') throw new ApiError(404, 'User not found or inactive')

  const alreadyMember = await ProjectMember.exists({ projectId, userId: memberUserId })
  if (alreadyMember) throw new ApiError(409, 'User is already a member of this project')

  await ProjectMember.create({ projectId, userId: memberUserId })
  return member
}
