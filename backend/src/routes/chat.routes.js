import { Router } from 'express'
import { create, list } from '../controllers/chat.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/:projectId/chat', list)
router.post('/:projectId/chat', create)

export default router
