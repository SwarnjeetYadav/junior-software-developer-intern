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
  addMember: (projectId, userId) => request('/projects/' + projectId + '/members', { method: 'POST', body: JSON.stringify({ userId }) }),
  dashboard: () => request('/dashboard/summary'),
  listComments: (taskId) => request('/comments/tasks/' + taskId + '/comments'),
  addComment: (taskId, message) => request('/comments/tasks/' + taskId + '/comments', { method: 'POST', body: JSON.stringify({ message }) }),
  listActivity: () => request('/activity'),
  listNotifications: () => request('/notifications'),
  markNotificationRead: (notificationId) => request('/notifications/' + notificationId + '/read', { method: 'PATCH' }),
}
