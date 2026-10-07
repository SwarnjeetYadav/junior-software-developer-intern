import { Router } from 'express'
import { add, candidates, list } from '../controllers/member.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/:projectId/members', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), list)
router.get('/:projectId/members/candidates', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), candidates)
router.post('/:projectId/members', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), add)

export default router
