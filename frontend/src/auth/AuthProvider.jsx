import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function getStoredUser() {
  const token = localStorage.getItem('teamflow_token')
  if (!token) return null

  const raw = localStorage.getItem('teamflow_user')
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem('teamflow_user')
    localStorage.removeItem('teamflow_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [demoMode, setDemoMode] = useState(false)

  const login = async (credentials) => {
    const result = await api.login(credentials)
    localStorage.setItem('teamflow_token', result.data.token)
    localStorage.setItem('teamflow_user', JSON.stringify(result.data.user))
    localStorage.removeItem('teamflow_demo')
    setUser(result.data.user)
    setDemoMode(false)
    return result.data.user
  }

  const register = async (details) => {
    const result = await api.register(details)
    localStorage.setItem('teamflow_token', result.data.token)
    localStorage.setItem('teamflow_user', JSON.stringify(result.data.user))
    localStorage.removeItem('teamflow_demo')
    setUser(result.data.user)
    setDemoMode(false)
    return result.data.user
  }

  const enterDemo = () => {
    const demoUser = { id: 'demo-user', name: 'Swarnjeet Yadav', initials: 'SY', role: 'PROJECT_MANAGER' }
    localStorage.removeItem('teamflow_token')
    localStorage.removeItem('teamflow_user')
    localStorage.removeItem('teamflow_demo')
    setUser(demoUser)
    setDemoMode(true)
  }

  const logout = () => {
    localStorage.removeItem('teamflow_token')
    localStorage.removeItem('teamflow_user')
    localStorage.removeItem('teamflow_demo')
    setUser(null)
    setDemoMode(false)
  }

  const value = useMemo(() => ({ user, demoMode, login, register, enterDemo, logout }), [user, demoMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
