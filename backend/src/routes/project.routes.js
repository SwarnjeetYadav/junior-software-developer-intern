import { Router } from 'express'
import { create, getOne, list } from '../controllers/project.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/', list)
router.post('/', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), create)
router.get('/:projectId', getOne)
export default router
