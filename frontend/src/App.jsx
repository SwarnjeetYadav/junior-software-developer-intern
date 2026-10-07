import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CreateTaskModal from './components/CreateTaskModal'
import CreateProjectModal from './components/CreateProjectModal'
import TaskDetailsModal from './components/TaskDetailsModal'
import { tasks as initialTasks } from './data/teamflowMock'
import Overview from './pages/Overview'
import Login from './pages/Login'
import { GenericPage } from './pages'
import { useAuth } from './auth/AuthProvider'
import { useTeamflowData } from './hooks/useTeamflowData'
import { api } from './lib/api'

export default function App() {
  const { user, logout, demoMode } = useAuth()
  const liveData = useTeamflowData(Boolean(user) && !demoMode)
  const [page, setPage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [createdTasks, setCreatedTasks] = useState([])

  const allTasks = useMemo(() => [...createdTasks, ...initialTasks], [createdTasks])
  if (!user) return <Login />

  const activeData = demoMode
    ? { connected: false, error: '', summary: null, projects: [], tasks: [], members: [], activity: [], notifications: [] }
    : liveData

  const navigate = (nextPage) => {
    setPage(nextPage)
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
      <Sidebar page={page} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Topbar
          page={page}
          onOpenMenu={() => setSidebarOpen(true)}
          onLogout={logout}
          demoMode={demoMode}
          notifications={activeData.notifications}
          onMarkRead={handleMarkNotificationRead}
        />

        <main className="content">
          {page === 'Overview' ? (
            <Overview
              onNavigate={navigate}
              onCreateTask={() => setTaskModalOpen(true)}
              onSuggestAssignee={() => setTaskModalOpen(true)}
              onSelectTask={setSelectedTask}
              liveData={activeData}
            />
          ) : (
            <GenericPage
              page={page}
              taskRows={demoMode ? allTasks : activeData.tasks.length ? activeData.tasks : initialTasks}
              onCreateTask={() => setTaskModalOpen(true)}
              onCreateProject={() => setProjectModalOpen(true)}
              onSelectTask={setSelectedTask}
              liveData={activeData}
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
        project={!demoMode ? activeData.projects[0] : null}
        members={!demoMode ? activeData.members : []}
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
        onClose={() => setSelectedTask(null)}
        onChanged={liveData.refresh}
      />
    </div>
  )
}
