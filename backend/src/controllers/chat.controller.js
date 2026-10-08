import { asyncHandler } from '../utils/asyncHandler.js'
import { listProjectMessages, sendProjectMessage } from '../services/chat.service.js'

export const list = asyncHandler(async (req, res) => {
  const messages = await listProjectMessages({
    projectId: req.params.projectId,
    userId: req.user.id,
    role: req.user.role,
  })
  res.json({ success: true, data: messages })
})

export const create = asyncHandler(async (req, res) => {
  const message = await sendProjectMessage({
    projectId: req.params.projectId,
    userId: req.user.id,
    role: req.user.role,
    message: req.body.message,
  })
  res.status(201).json({ success: true, data: message })
})
