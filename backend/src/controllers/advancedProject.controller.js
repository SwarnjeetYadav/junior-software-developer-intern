import { asyncHandler } from '../utils/asyncHandler.js'
import { getProjectAnalytics } from '../services/analytics.service.js'
import { getProjectInsights } from '../services/insights.service.js'
import { createInvitation, listProjectInvitations } from '../services/invitation.service.js'
import { ensureProjectAccess } from '../services/project.service.js'

export const analytics = asyncHandler(async (req, res) => {
  await ensureProjectAccess(req.params.projectId, req.user.id, req.user.role)
  const data = await getProjectAnalytics(req.params.projectId)
  res.json({ success: true, data })
})

export const insights = asyncHandler(async (req, res) => {
  await ensureProjectAccess(req.params.projectId, req.user.id, req.user.role)
  const data = await getProjectInsights(req.params.projectId)
  res.json({ success: true, data })
})

export const listInvitations = asyncHandler(async (req, res) => {
  const data = await listProjectInvitations({
    projectId: req.params.projectId,
    userId: req.user.id,
    role: req.user.role,
  })
  res.json({ success: true, data })
})

export const invite = asyncHandler(async (req, res) => {
  const invitation = await createInvitation({
    projectId: req.params.projectId,
    userId: req.user.id,
    role: req.user.role,
    invitedUserId: req.body.invitedUserId,
    projectRole: req.body.projectRole,
  })
  res.status(201).json({ success: true, data: invitation })
})
