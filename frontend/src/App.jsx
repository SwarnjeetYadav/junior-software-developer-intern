import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CreateTaskModal from './components/CreateTaskModal'
import CreateProjectModal from './components/CreateProjectModal'
import TaskDetailsModal from './components/TaskDetailsModal'
import { projects as demoProjects } from './data/teamflowMock'
import Overview from './pages/Overview'
import Login from './pages/Login'
import { GenericPage } from './pages'
import { useAuth } from './auth/AuthProvider'
import { useTeamflowData } from './hooks/useTeamflowData'
import { api } from './lib/api'

const ROUTES = {
  Overview: '/',
  Projects: '/projects',
  'My Tasks': '/my-tasks',
  Team: '/team',
  Reports: '/reports',
  Settings: '/settings',
}

function pageFromPath(pathname) {
  const match = Object.entries(ROUTES).find(([, path]) => path === pathname)
  return match?.[0] || 'Overview'
}

function LoadingScreen() {
  return (
    <div className="auth-loading-screen" role="status" aria-live="polite">
      <span className="brand-mark">AN</span>
      <strong>Loading Anvaya…</strong>
      <small>Checking your session</small>
    </div>
  )
}

export default function App() {
  const { user, logout, demoMode, authLoading } = useAuth()
  const liveData = useTeamflowData(Boolean(user) && !demoMode)
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskPrefillDueDate, setTaskPrefillDueDate] = useState('')

  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      if (window.location.pathname !== '/auth/login') {
        window.history.replaceState({}, '', '/auth/login')
      }
      return
    }

    if (window.location.pathname === '/auth/login' || !Object.values(ROUTES).includes(window.location.pathname)) {
      window.history.replaceState({}, '', ROUTES[page] || '/')
      setPage((current) => Object.prototype.hasOwnProperty.call(ROUTES, current) ? current : 'Overview')
    }
  }, [user, authLoading, page])

  if (authLoading) return <LoadingScreen />
  if (!user) return <Login />

  const activeData = demoMode
    ? { connected: false, loading: false, error: '', summary: null, projects: [], tasks: [], members: [], membersByProject: {}, activity: [], notifications: [], refresh: () => {} }
    : liveData

  const openTaskCreator = (dueDate = '') => {
    setTaskPrefillDueDate(dueDate || '')
    setTaskModalOpen(true)
  }

  const navigate = (nextPage) => {
    const nextPath = ROUTES[nextPage] || '/'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ page: nextPage }, '', nextPath)
    }
    setPage(nextPage)
    setSelectedTask(null)
    setTaskPrefillDueDate('')
    setSidebarOpen(false)
  }

  const handleCreateTask = async (payload) => {
    if (demoMode) return
    await api.createTask(payload.projectId, payload.payload)
    setTaskModalOpen(false)
    navigate('My Tasks')
    liveData.refresh()
  }

  const handleCreateProject = async (payload) => {
    if (demoMode) return
    await api.createProject(payload)
    setProjectModalOpen(false)
    navigate('Projects')
    liveData.refresh()
  }

  const handleMarkNotificationRead = async (notificationId) => {
    await api.markNotificationRead(notificationId)
    liveData.refresh()
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} liveData={activeData} />

      <div className="app-main">
        <Topbar
          page={page}
          onOpenMenu={() => setSidebarOpen(true)}
          onLogout={logout}
          onExitDemo={logout}
          demoMode={demoMode}
          notifications={activeData.notifications}
          onMarkRead={handleMarkNotificationRead}
          user={user}
        />

        <main className="content">
          {page === 'Overview' ? (
            <Overview
              onNavigate={navigate}
              onCreateTask={() => openTaskCreator()}
              onSuggestAssignee={() => openTaskCreator()}
              onSelectTask={setSelectedTask}
              liveData={activeData}
              user={user}
            />
          ) : (
            <GenericPage
              page={page}
              onCreateTask={() => openTaskCreator()}
              onCreateTaskForDate={(date) => openTaskCreator(date)}
              onOpenTeam={() => navigate('Team')}
              onCreateProject={() => setProjectModalOpen(true)}
              onSelectTask={setSelectedTask}
              liveData={activeData}
              currentUserId={user.id}
              currentUser={user}
              canCreateProjects={!demoMode}
              onMembersChanged={liveData.refresh}
              invitations={activeData.invitations || []}
            />
          )}
        </main>
      </div>

      {sidebarOpen ? <button className="mobile-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

      <CreateTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onCreate={handleCreateTask}
        liveMode={!demoMode}
        projects={!demoMode ? activeData.projects : []}
        membersByProject={!demoMode ? activeData.membersByProject : {}}
        demoProject={demoProjects[0]}
        initialDueDate={taskPrefillDueDate}
      />

      <CreateProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <TaskDetailsModal
        task={selectedTask}
        open={Boolean(selectedTask)}
        liveMode={!demoMode}
        projectMembers={!demoMode && selectedTask ? (activeData.membersByProject[selectedTask.projectId] || []) : []}
        onClose={() => setSelectedTask(null)}
        onChanged={liveData.refresh}
      />
    </div>
  )
}
