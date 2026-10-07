import { asyncHandler } from '../utils/asyncHandler.js'
import { addMember, listMembers } from '../services/member.service.js'

export const list = asyncHandler(async (req, res) => {
  const members = await listMembers(req.params.projectId, req.user.id, req.user.role)
  res.json({ success: true, data: members })
})

export const add = asyncHandler(async (req, res) => {
  const member = await addMember(
    req.params.projectId,
    req.user.id,
    req.user.role,
    req.body.userId,
  )
  res.status(201).json({ success: true, data: member })
})
