import { Router } from 'express'
import { add, list } from '../controllers/member.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/:projectId/members', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), list)
router.post('/:projectId/members', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), add)

export default router
