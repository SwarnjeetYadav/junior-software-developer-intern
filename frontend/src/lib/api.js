const API_BASE = import.meta.env.API_BASE_URL || 'http://localhost:5000/api/v1'

async function request(path, options = {}) {
  const token = localStorage.getItem('teamflow_token')
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(API_BASE + path, { ...options, headers })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed')
    error.status = response.status
    throw error
  }

  return payload
}

export const api = {
  health: () => request('/health'),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  listProjects: () => request('/projects'),
  getProject: (projectId) => request('/projects/' + projectId),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  listTasks: (projectId, query = '') => request('/tasks/project/' + projectId + query),
  createTask: (projectId, body) => request('/tasks/project/' + projectId, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (taskId, body) => request('/tasks/' + taskId, { method: 'PATCH', body: JSON.stringify(body) }),
  listMembers: (projectId) => request('/projects/' + projectId + '/members'),
  searchMemberCandidates: (projectId, query) => request('/projects/' + projectId + '/members/candidates?q=' + encodeURIComponent(query)),
  addMember: (projectId, userId, projectRole = 'MEMBER') => request('/projects/' + projectId + '/members', { method: 'POST', body: JSON.stringify({ userId, projectRole }) }),
  updateMemberRole: (projectId, userId, projectRole) => request('/projects/' + projectId + '/members/' + userId, { method: 'PATCH', body: JSON.stringify({ projectRole }) }),
  removeMember: (projectId, userId) => request('/projects/' + projectId + '/members/' + userId, { method: 'DELETE' }),
  listProjectChat: (projectId) => request('/projects/' + projectId + '/chat'),
  sendProjectChat: (projectId, message) => request('/projects/' + projectId + '/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  listProjectActivity: (projectId) => request('/projects/' + projectId + '/activity'),
  listProjectAnalytics: (projectId) => request('/projects/' + projectId + '/analytics'),
  listProjectInsights: (projectId) => request('/projects/' + projectId + '/insights'),
  getAssignmentSuggestionsForProject: (projectId, params = {}) => {
    const query = new URLSearchParams()
    if (params.priority) query.set('priority', params.priority)
    if (params.dueDate) query.set('dueDate', params.dueDate)
    if (params.estimateMinutes) query.set('estimateMinutes', String(params.estimateMinutes))
    return request('/projects/' + projectId + '/assignment-suggestions?' + query.toString())
  },
  getAssignmentSuggestions: (taskId) => request('/tasks/' + taskId + '/assignment-suggestions'),
  listTaskDependencies: (taskId) => request('/tasks/' + taskId + '/dependencies'),
  addTaskDependency: (taskId, predecessorTaskId) => request('/tasks/' + taskId + '/dependencies', { method: 'POST', body: JSON.stringify({ predecessorTaskId }) }),
  removeTaskDependency: (taskId, dependencyId) => request('/tasks/' + taskId + '/dependencies/' + dependencyId, { method: 'DELETE' }),
  listTaskBlockers: (taskId) => request('/tasks/' + taskId + '/blockers'),
  listTaskActivity: (taskId) => request('/tasks/' + taskId + '/activity'),
  listSearch: (query) => request('/search?q=' + encodeURIComponent(query)),
  listProjectInvitations: (projectId) => request('/projects/' + projectId + '/invitations'),
  createProjectInvitation: (projectId, invitedUserId, projectRole = 'MEMBER') => request('/projects/' + projectId + '/invitations', { method: 'POST', body: JSON.stringify({ invitedUserId, projectRole }) }),
  listMyInvitations: () => request('/invitations'),
  respondToInvitation: (invitationId, action) => request('/invitations/' + invitationId, { method: 'PATCH', body: JSON.stringify({ action }) }),
  dashboard: () => request('/dashboard/summary'),
  listComments: (taskId) => request('/comments/tasks/' + taskId + '/comments'),
  addComment: (taskId, message) => request('/comments/tasks/' + taskId + '/comments', { method: 'POST', body: JSON.stringify({ message }) }),
  listActivity: () => request('/activity'),
  listNotifications: () => request('/notifications'),
  markNotificationRead: (notificationId) => request('/notifications/' + notificationId + '/read', { method: 'PATCH' }),
}
