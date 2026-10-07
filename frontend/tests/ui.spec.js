import { test, expect } from '@playwright/test'

const project = {
  _id: 'project-1',
  name: 'TeamFlow Web App',
  description: 'Core TeamFlow workspace',
  ownerId: 'user-1',
  dueDate: '2026-10-24T00:00:00.000Z',
  status: 'ACTIVE',
}

const users = {
  owner: { _id: 'user-1', name: 'Swarnjeet Yadav', email: 'swarnjeet@example.com', role: 'PROJECT_MANAGER', status: 'ACTIVE' },
  teammate: { _id: 'user-2', name: 'Ankit Kumar', email: 'ankit@example.com', role: 'TEAM_MEMBER', status: 'ACTIVE' },
  candidate: { _id: 'user-3', name: 'Priya Shah', email: 'priya@example.com', role: 'TEAM_MEMBER', status: 'ACTIVE' },
}

function routeApi(page) {
  const state = {
    projects: [project],
    members: [
      { _id: 'membership-1', projectId: project._id, userId: users.owner },
      { _id: 'membership-2', projectId: project._id, userId: users.teammate },
    ],
    tasks: [
      {
        _id: 'task-1',
        projectId: project._id,
        title: 'Build live task board',
        description: 'Regression task',
        priority: 'HIGH',
        status: 'TODO',
        assigneeId: users.owner,
        dueDate: '2026-10-15T00:00:00.000Z',
      },
      {
        _id: 'task-2',
        projectId: project._id,
        title: 'Review API contract',
        description: '',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        assigneeId: users.teammate,
        dueDate: '2026-10-10T00:00:00.000Z',
      },
    ],
    activities: [],
    notifications: [],
  }

  return page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const json = async (status, data) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    })

    if (method === 'GET' && path === '/dashboard/summary') {
      return json(200, { activeProjects: 1, openTasks: state.tasks.filter((item) => item.status !== 'COMPLETED').length, completedTasks: 1, overdueTasks: 0 })
    }
    if (method === 'GET' && path === '/projects') return json(200, state.projects)
    if (method === 'GET' && path === '/activity') return json(200, state.activities)
    if (method === 'GET' && path === '/notifications') return json(200, state.notifications)
    if (method === 'GET' && /^\/projects\/project-1\/members\/candidates$/.test(path)) {
      const query = (url.searchParams.get('q') || '').toLowerCase()
      const already = new Set(state.members.map((item) => item.userId._id))
      const data = query.length >= 2 && !already.has(users.candidate._id) && (users.candidate.name.toLowerCase().includes(query) || users.candidate.email.includes(query))
        ? [users.candidate]
        : []
      return json(200, data)
    }
    if (method === 'GET' && path === '/projects/project-1/members') return json(200, state.members)
    if (method === 'POST' && path === '/projects/project-1/members') {
      const body = JSON.parse(request.postData() || '{}')
      if (body.userId === users.candidate._id) {
        state.members.push({ _id: 'membership-3', projectId: project._id, userId: users.candidate })
      }
      return json(201, users.candidate)
    }
    if (method === 'GET' && path === '/tasks/project/project-1') return json(200, state.tasks)
    if (method === 'PATCH' && /^\/tasks\/task-/.test(path)) {
      const taskId = path.split('/').pop()
      const body = JSON.parse(request.postData() || '{}')
      const task = state.tasks.find((item) => item._id === taskId)
      Object.assign(task, body)
      if (body.assigneeId) task.assigneeId = users.candidate._id === body.assigneeId ? users.candidate : users.owner
      return json(200, task)
    }
    if (method === 'GET' && path.startsWith('/comments/tasks/')) return json(200, [])
    if (method === 'GET' && path === '/auth/me') return json(200, users.owner)
    return json(200, [])
  })
}

async function seedLiveSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('teamflow_token', 'playwright-token')
    localStorage.setItem('teamflow_user', JSON.stringify({
      id: 'user-1',
      name: 'Swarnjeet Yadav',
      initials: 'SY',
      role: 'PROJECT_MANAGER',
    }))
  })
}

test('demo workspace navigation and task creation remain functional', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Preview demo workspace/i }).click()
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Swarnjeet/i })).toBeVisible()

  await page.getByRole('button', { name: 'My Tasks' }).click()
  await page.getByRole('button', { name: /Create task/i }).click()
  await page.getByLabel('Task title').fill('Browser regression task')
  await page.getByRole('button', { name: 'Create task' }).click()

  await expect(page.getByText('Browser regression task')).toBeVisible()
})

test('live Projects view uses API data and task filters', async ({ page }) => {
  await seedLiveSession(page)
  await routeApi(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  await expect(page.getByText('TeamFlow Web App')).toBeVisible()
  await expect(page.getByText('50%')).toBeVisible()

  await page.getByLabel('Filter task status').selectOption('TODO')
  await expect(page.getByText('Build live task board')).toBeVisible()
  await expect(page.getByText('Review API contract')).not.toBeVisible()

  await page.getByText('Build live task board').click()
  await expect(page.getByRole('heading', { name: 'Build live task board' })).toBeVisible()
  await page.locator('.task-details-modal').getByLabel('Status').selectOption('IN_PROGRESS')
  await page.locator('.task-details-modal').getByLabel('Priority').selectOption('CRITICAL')
  await expect(page.locator('.task-details-modal').getByLabel('Priority')).toHaveValue('CRITICAL')
})

test('live Team view can search and add a project member', async ({ page }) => {
  await seedLiveSession(page)
  await routeApi(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Team', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Manage project members' })).toBeVisible()

  await page.getByPlaceholder(/Priya or priya@example.com/i).fill('Priya')
  await expect(page.getByText('Priya Shah')).toBeVisible()
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText(/Priya Shah added/i)).toBeVisible()
})


test('login screen supports account creation and demo exit returns to login', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Work with clarity/i })).toBeVisible()

  await page.getByRole('button', { name: /Create an account/i }).click()
  await expect(page.getByRole('heading', { name: /Create your workspace account/i })).toBeVisible()
  await expect(page.getByLabel('Full name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()

  await page.getByRole('button', { name: /Sign in/i }).last().click()
  await expect(page.getByRole('heading', { name: /Work with clarity/i })).toBeVisible()

  await page.getByRole('button', { name: /Preview demo workspace/i }).click()
  await expect(page.getByRole('button', { name: /Exit demo · Back to sign in/i })).toBeVisible()
  await page.getByRole('button', { name: /Exit demo · Back to sign in/i }).click()
  await expect(page.getByRole('heading', { name: /Work with clarity/i })).toBeVisible()
})


async function routeEmptyLiveWorkspace(page) {
  return page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const json = async (status, data) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    })

    if (request.method() === 'GET' && path === '/dashboard/summary') {
      return json(200, { activeProjects: 0, openTasks: 0, completedTasks: 0, overdueTasks: 0 })
    }
    if (request.method() === 'GET' && path === '/projects') return json(200, [])
    if (request.method() === 'GET' && path === '/activity') return json(200, [])
    if (request.method() === 'GET' && path === '/notifications') return json(200, [])
    if (request.method() === 'GET' && path === '/auth/me') return json(200, {
      id: 'test-user',
      name: 'test1',
      email: 'test1@example.com',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    })
    return json(200, [])
  })
}

test('new live user sees only real account data when workspace is empty', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('teamflow_token', 'test-token')
    localStorage.setItem('teamflow_user', JSON.stringify({
      id: 'test-user',
      name: 'test1',
      email: 'test1@example.com',
      role: 'TEAM_MEMBER',
    }))
    localStorage.removeItem('teamflow_demo')
  })
  await routeEmptyLiveWorkspace(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), test1/i })).toBeVisible()
  await expect(page.getByText('No projects yet.', { exact: false })).toBeVisible()
  await expect(page.getByText(/No team workload data yet/i)).toBeVisible()
  await expect(page.getByText('TeamFlow Web App')).not.toBeVisible()
  await expect(page.getByText('Ankit Kumar')).not.toBeVisible()
  await expect(page.getByText('Swarnjeet')).not.toBeVisible()

  await page.getByRole('button', { name: 'Projects' }).click()
  await expect(page.getByRole('button', { name: /New project/i })).not.toBeVisible()
  await expect(page.getByText(/No projects yet/i)).toBeVisible()

  await page.getByRole('button', { name: 'Team' }).click()
  await expect(page.getByText(/No team members are visible/i)).toBeVisible()

  await page.getByRole('button', { name: 'Reports' }).click()
  await expect(page.getByText('No tasks available yet.')).toBeVisible()
})

test('live workspace navigation never drops to a blank page', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('teamflow_token', 'test-token')
    localStorage.setItem('teamflow_user', JSON.stringify({
      id: 'test-user',
      name: 'test1',
      email: 'test1@example.com',
      role: 'TEAM_MEMBER',
    }))
  })

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const json = async (status, data) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    })

    if (request.method() === 'GET' && path === '/dashboard/summary') return json(200, { activeProjects: 0, openTasks: 0, completedTasks: 0, overdueTasks: 0 })
    if (request.method() === 'GET' && path === '/projects') return json(200, [])
    if (request.method() === 'GET' && path === '/activity') return json(200, [])
    if (request.method() === 'GET' && path === '/notifications') return json(200, [])
    if (request.method() === 'GET' && path === '/auth/me') return json(200, { id: 'test-user', name: 'test1', email: 'test1@example.com', role: 'TEAM_MEMBER', status: 'ACTIVE' })
    return json(200, [])
  })

  await page.goto('/auth/login')
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), test1/i })).toBeVisible()
  await expect(page).toHaveURL(/http:\/\/127\.0\.0\.1:4173\/$/)

  for (const [label, heading] of [
    ['Projects', 'Projects'],
    ['My Tasks', 'My Tasks'],
    ['Team', 'Team'],
    ['Reports', 'Reports'],
    ['Settings', 'Settings'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
})
