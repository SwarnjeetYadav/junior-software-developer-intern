import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CreateTaskModal from './components/CreateTaskModal'
import { tasks as initialTasks } from './data/teamflowMock'
import Overview from './pages/Overview'
import Login from './pages/Login'
import { GenericPage } from './pages'
import { useAuth } from './auth/AuthProvider'

export default function App() {
  const { user, logout, demoMode } = useAuth()
  const [page, setPage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [createdTasks, setCreatedTasks] = useState([])

  const allTasks = useMemo(() => [...createdTasks, ...initialTasks], [createdTasks])

  if (!user) return <Login />

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSidebarOpen(false)
  }

  const createTask = (task) => {
    setCreatedTasks((current) => [task, ...current])
    setTaskModalOpen(false)
    setPage('My Tasks')
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
            />
          ) : (
            <GenericPage
              page={page}
              taskRows={page === 'My Tasks' ? allTasks : initialTasks}
              onCreateTask={() => setTaskModalOpen(true)}
            />
          )}
        </main>
      </div>
      {sidebarOpen ? <button className="mobile-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}
      <CreateTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} onCreate={createTask} />
    </div>
  )
}
