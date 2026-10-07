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

function mapProject(project, projectTasks, projectMembers, index) {
  const totalTasks = projectTasks.length
  const completedTasks = projectTasks.filter((task) => task.statusValue === 'COMPLETED').length

  return {
    ...project,
    memberCount: projectMembers.length,
    taskCount: totalTasks,
    completedTaskCount: completedTasks,
    progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    tone: ['violet', 'blue', 'green'][index % 3],
    members: projectMembers,
  }
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
    membersByProject: {},
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
        const projectResults = await Promise.all(
          projectList.map(async (project) => {
            const [taskResult, memberResult] = await Promise.all([
              api.listTasks(project._id),
              api.listMembers(project._id),
            ])
            return {
              project,
              tasks: (taskResult.data || []).map((task) => mapTask(task, project)),
              members: (memberResult.data || [])
                .filter((item) => item.userId)
                .map((item, memberIndex) => ({
                  id: item.userId._id,
                  name: item.userId.name,
                  email: item.userId.email,
                  role: item.userId.role,
                  status: item.userId.status,
                  initials: initialsFor(item.userId.name),
                  tone: ['violet', 'blue', 'green', 'amber', 'rose'][memberIndex % 5],
                })),
            }
          }),
        )

        const allTasks = projectResults.flatMap((item) => item.tasks)
        const projectMembers = {}

        projectResults.forEach((item) => {
          projectMembers[item.project._id] = item.members
        })

        const memberMap = new Map()
        projectResults.forEach((item) => {
          const loadMap = new Map()
          for (const task of item.tasks) {
            if (task.assigneeId && task.statusValue !== 'COMPLETED') {
              loadMap.set(String(task.assigneeId), (loadMap.get(String(task.assigneeId)) || 0) + 1)
            }
          }

          item.members.forEach((member) => {
            const key = String(member.id)
            const existing = memberMap.get(key)
            if (existing) {
              existing.activeTasks += loadMap.get(key) || 0
              if (!existing.projectIds.includes(item.project._id)) existing.projectIds.push(item.project._id)
            } else {
              memberMap.set(key, {
                ...member,
                activeTasks: loadMap.get(key) || 0,
                projectIds: [item.project._id],
              })
            }
          })
        })

        const projects = projectResults.map((item, index) =>
          mapProject(item.project, item.tasks, item.members, index),
        )

        if (!cancelled) {
          setState({
            loading: false,
            connected: true,
            error: '',
            summary: dashboardResult.data,
            projects,
            tasks: allTasks,
            members: [...memberMap.values()],
            membersByProject: projectMembers,
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
