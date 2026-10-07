import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('teamflow_user')
    return raw ? JSON.parse(raw) : null
  })
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('teamflow_demo') === 'true')

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
    const demoUser = { name: 'Swarnjeet Yadav', initials: 'SY', role: 'Project Manager' }
    localStorage.removeItem('teamflow_token')
    localStorage.setItem('teamflow_user', JSON.stringify(demoUser))
    localStorage.setItem('teamflow_demo', 'true')
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
