import { asyncHandler } from '../utils/asyncHandler.js'
import { listProjectMessages, sendProjectMessage, toggleProjectMessageReaction } from '../services/chat.service.js'
import { publishProjectChatMessage, subscribeProjectChat } from '../services/chatRealtime.service.js'

export const list = asyncHandler(async (req, res) => {
  const data = await listProjectMessages({ projectId: req.params.projectId, userId: req.user.id, role: req.user.role, limit: req.query.limit })
  res.json({ success: true, data })
})

export const events = asyncHandler(async (req, res) => {
  await listProjectMessages({ projectId: req.params.projectId, userId: req.user.id, role: req.user.role, limit: 1 })
  res.status(200)
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
  res.flushHeaders?.()
  res.write('event: connected\ndata: {}\n\n')
  const unsubscribe = subscribeProjectChat(req.params.projectId, res)
  const heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write(': keep-alive\n\n') }, 25000)
  req.on('close', () => { clearInterval(heartbeat); unsubscribe() })
})

export const send = asyncHandler(async (req, res) => {
  const data = await sendProjectMessage({ projectId: req.params.projectId, userId: req.user.id, role: req.user.role, message: req.body.message, replyToId: req.body.replyToId, taskId: req.body.taskId, mentions: req.body.mentions })
  publishProjectChatMessage(req.params.projectId, data._id)
  res.status(201).json({ success: true, data })
})

export const react = asyncHandler(async (req, res) => {
  const data = await toggleProjectMessageReaction({ projectId: req.params.projectId, messageId: req.params.messageId, userId: req.user.id, role: req.user.role, emoji: req.body.emoji })
  publishProjectChatMessage(req.params.projectId, data._id)
  res.json({ success: true, data })
})
