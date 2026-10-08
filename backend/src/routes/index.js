import { Router } from 'express'
import authRoutes from './auth.routes.js'
import projectRoutes from './project.routes.js'
import taskRoutes from './task.routes.js'
import memberRoutes from './member.routes.js'
import chatRoutes from './chat.routes.js'
import commentRoutes from './comment.routes.js'
import activityRoutes from './activity.routes.js'
import notificationRoutes from './notification.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()
router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/tasks', taskRoutes)
router.use('/projects', memberRoutes)
router.use('/projects', chatRoutes)
router.use('/comments', commentRoutes)
router.use('/activity', activityRoutes)
router.use('/notifications', notificationRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
