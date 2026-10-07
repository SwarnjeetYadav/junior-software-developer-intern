import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const statusLabel = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
}

const priorityLabel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export function useTeamflowData(enabled) {
  const [state, setState] = useState({
    loading: false,
    connected: false,
    error: '',
    summary: null,
    projects: [],
    tasks: [],
  })

  useEffect(() => {
    let cancelled = false
    if (!enabled) return undefined

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }))

      try {
        const [dashboardResult, projectsResult] = await Promise.all([
          api.dashboard(),
          api.listProjects(),
        ])

        let remoteTasks = []
        const firstProject = projectsResult.data?.[0]

        if (firstProject?._id) {
          const taskResult = await api.listTasks(firstProject._id)
          remoteTasks = (taskResult.data || []).map((task) => ({
            id: String(task._id).slice(-6).toUpperCase(),
            title: task.title,
            project: firstProject.name,
            assignee: task.assigneeId?.name || 'Unassigned',
            assigneeName: task.assigneeId?.name || 'Unassigned',
            priority: priorityLabel[task.priority] || task.priority,
            status: statusLabel[task.status] || task.status,
            due: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Not set',
          }))
        }

        if (!cancelled) {
          setState({
            loading: false,
            connected: true,
            error: '',
            summary: dashboardResult.data,
            projects: projectsResult.data || [],
            tasks: remoteTasks,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            connected: false,
            error: error.message,
          }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [enabled])

  return state
}
