import { Router } from 'express'
import { create, list, update } from '../controllers/task.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/project/:projectId', list)
router.post('/project/:projectId', create)
router.patch('/:taskId', update)
export default router
