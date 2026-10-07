import { Router } from 'express'
import { create, list, update } from '../controllers/task.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/project/:projectId', list)
router.post('/project/:projectId', requireRole('ADMINISTRATOR', 'PROJECT_MANAGER'), create)
router.patch('/:taskId', update)
export default router
