import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CreateTaskModal from './components/CreateTaskModal'
import CreateProjectModal from './components/CreateProjectModal'
import TaskDetailsModal from './components/TaskDetailsModal'
import { projects as demoProjects, tasks as initialTasks } from './data/teamflowMock'
import Overview from './pages/Overview'
import Login from './pages/Login'
import { GenericPage } from './pages'
import { useAuth } from './auth/AuthProvider'
import { useTeamflowData } from './hooks/useTeamflowData'
import { api } from './lib/api'

function LoadingScreen() {
  return (
    <div className="auth-loading-screen" role="status" aria-live="polite">
      <span className="brand-mark">TF</span>
      <strong>Loading TeamFlow…</strong>
      <small>Checking your session</small>
    </div>
  )
}

export default function App() {
  const { user, logout, demoMode, authLoading } = useAuth()
  const liveData = useTeamflowData(Boolean(user) && !demoMode)
  const [page, setPage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [createdTasks, setCreatedTasks] = useState([])

  if (authLoading) return <LoadingScreen />
  if (!user) return <Login />

  const activeData = demoMode
    ? { connected: false, loading: false, error: '', summary: null, projects: [], tasks: [], members: [], membersByProject: {}, activity: [], notifications: [], refresh: () => {} }
    : liveData

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSelectedTask(null)
    setSidebarOpen(false)
  }

  const handleCreateTask = async (payload) => {
    if (demoMode) {
      setCreatedTasks((current) => [payload, ...current])
      setTaskModalOpen(false)
      setPage('My Tasks')
      return
    }

    await api.createTask(payload.projectId, payload.payload)
    setTaskModalOpen(false)
    setPage('My Tasks')
    liveData.refresh()
  }

  const handleCreateProject = async (payload) => {
    if (demoMode) return
    await api.createProject(payload)
    setProjectModalOpen(false)
    setPage('Projects')
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
              onCreateTask={() => setTaskModalOpen(true)}
              onSuggestAssignee={() => setTaskModalOpen(true)}
              onSelectTask={setSelectedTask}
              liveData={activeData}
              user={user}
            />
          ) : (
            <GenericPage
              page={page}
              taskRows={demoMode ? [...createdTasks, ...initialTasks] : activeData.tasks}
              onCreateTask={() => setTaskModalOpen(true)}
              onCreateProject={() => setProjectModalOpen(true)}
              onSelectTask={setSelectedTask}
              liveData={activeData}
              currentUserId={user.id}
              currentUser={user}
              canManageProjects={user.role === 'ADMINISTRATOR' || user.role === 'PROJECT_MANAGER'}
              onMembersChanged={liveData.refresh}
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
