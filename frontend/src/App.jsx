import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CreateTaskModal from './components/CreateTaskModal'
import CreateProjectModal from './components/CreateProjectModal'
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
  const [createdTasks, setCreatedTasks] = useState([])

  const allTasks = useMemo(() => [...createdTasks, ...initialTasks], [createdTasks])

  if (!user) return <Login />

  const remoteState = liveData.connected
  const activeData = demoMode
    ? { connected: false, error: '', summary: null, projects: [], tasks: [] }
    : liveData

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSidebarOpen(false)
  }

  const createTask = (task) => {
    setCreatedTasks((current) => [task, ...current])
    setTaskModalOpen(false)
    setPage('My Tasks')
  }

  const createProject = async (payload) => {
    if (demoMode) {
      setProjectModalOpen(false)
      return
    }
    await api.createProject(payload)
    liveData.refresh()
    setPage('Projects')
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar page={page} onOpenMenu={() => setSidebarOpen(true)} onLogout={logout} demoMode={demoMode} />
        <main className="content">
          {page === 'Overview' ? (
            <Overview
              onNavigate={navigate}
              onCreateTask={() => setTaskModalOpen(true)}
              onSuggestAssignee={() => setTaskModalOpen(true)}
              liveData={activeData}
            />
          ) : (
            <GenericPage
              page={page}
              taskRows={demoMode ? allTasks : liveData.tasks.length ? liveData.tasks : initialTasks}
              onCreateTask={() => setTaskModalOpen(true)}
              onCreateProject={() => setProjectModalOpen(true)}
              liveData={activeData}
            />
          )}
        </main>
      </div>
      {sidebarOpen ? <button className="mobile-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}
      <CreateTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onCreate={createTask} />
      <CreateProjectModal open={projectModalOpen} onClose={() => setProjectModalOpen(false)} onCreate={createProject} />
    </div>
  )
}
