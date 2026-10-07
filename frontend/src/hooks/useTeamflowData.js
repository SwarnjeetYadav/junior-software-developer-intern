import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const statusLabel = { TODO: 'Todo', IN_PROGRESS: 'In Progress', REVIEW: 'Review', BLOCKED: 'Blocked', COMPLETED: 'Completed' }
const priorityLabel = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }

function initialsFor(name = 'TeamFlow') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function mapTask(task, project) {
  return {
    apiId: task._id,
    projectId: project._id,
    id: String(task._id).slice(-6).toUpperCase(),
    title: task.title,
    project: project.name,
    assignee: task.assigneeId?.name || 'Unassigned',
    assigneeName: task.assigneeId?.name || 'Unassigned',
    assigneeId: task.assigneeId?._id || null,
    priority: priorityLabel[task.priority] || task.priority,
    priorityValue: task.priority,
    status: statusLabel[task.status] || task.status,
    statusValue: task.status,
    due: task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : 'Not set',
    dueDate: task.dueDate || null,
    description: task.description || '',
  }
}

function mapActivity(item) {
  return {
    initials: initialsFor(item.userId?.name),
    person: item.userId?.name || 'TeamFlow',
    action: formatActivity(item),
    time: new Date(item.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    tone: 'violet',
  }
}

function formatActivity(item) {
  if (item.action === 'TASK_CREATED') return 'created a new task'
  if (item.action === 'TASK_UPDATED') return 'updated a task'
  if (item.action === 'COMMENT_ADDED') return 'added a comment'
  return item.action.replaceAll('_', ' ').toLowerCase()
}

export function useTeamflowData(enabled) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [state, setState] = useState({
    loading: false,
    connected: false,
    error: '',
    summary: null,
    projects: [],
    tasks: [],
    members: [],
    activity: [],
    notifications: [],
  })

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    if (!enabled) return undefined

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }))

      try {
        const [dashboardResult, projectsResult, activityResult, notificationResult] = await Promise.all([
          api.dashboard(),
          api.listProjects(),
          api.listActivity(),
          api.listNotifications(),
        ])

        const projectList = projectsResult.data || []
        const taskResults = await Promise.all(
          projectList.map(async (project) => {
            const result = await api.listTasks(project._id)
            return (result.data || []).map((task) => mapTask(task, project))
          }),
        )
        const allTasks = taskResults.flat().slice(0, 50)

        let members = []
        const firstProject = projectList[0]
        if (firstProject?._id) {
          const memberResult = await api.listMembers(firstProject._id)
          const loadMap = new Map()

          for (const task of allTasks.filter((item) => item.projectId === firstProject._id)) {
            if (task.assigneeId) {
              loadMap.set(String(task.assigneeId), (loadMap.get(String(task.assigneeId)) || 0) + (task.statusValue === 'COMPLETED' ? 0 : 1))
            }
          }

          members = (memberResult.data || [])
            .filter((item) => item.userId)
            .map((item, index) => ({
              id: item.userId._id,
              name: item.userId.name,
              initials: initialsFor(item.userId.name),
              activeTasks: loadMap.get(String(item.userId._id)) || 0,
              tone: ['violet', 'blue', 'green', 'amber', 'rose'][index % 5],
            }))
        }

        if (!cancelled) {
          setState({
            loading: false,
            connected: true,
            error: '',
            summary: dashboardResult.data,
            projects: projectList,
            tasks: allTasks,
            members,
            activity: (activityResult.data || []).map(mapActivity),
            notifications: (notificationResult.data || []).map((item) => ({ ...item, unread: !item.readAt })),
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({ ...current, loading: false, connected: false, error: error.message }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [enabled, refreshKey])

  return { ...state, refresh }
}
