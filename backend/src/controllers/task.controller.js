import { asyncHandler } from '../utils/asyncHandler.js'
import { createTask, listTasks, updateTask } from '../services/task.service.js'

export const create = asyncHandler(async (req, res) => {
  const task = await createTask({
    userId: req.user.id,
    role: req.user.role,
    projectId: req.params.projectId,
    payload: req.body,
  })
  res.status(201).json({ success: true, data: task })
})

export const list = asyncHandler(async (req, res) => {
  const tasks = await listTasks({
    userId: req.user.id,
    role: req.user.role,
    projectId: req.params.projectId,
    query: req.query,
  })
  res.json({ success: true, data: tasks })
})

export const update = asyncHandler(async (req, res) => {
  const task = await updateTask({
    userId: req.user.id,
    role: req.user.role,
    taskId: req.params.taskId,
    payload: req.body,
  })
  res.json({ success: true, data: task })
})
