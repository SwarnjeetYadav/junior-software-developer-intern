import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function clearStoredSession() {
  localStorage.removeItem('teamflow_token')
  localStorage.removeItem('teamflow_user')
  localStorage.removeItem('teamflow_demo')
}

function readStoredUser() {
  const token = localStorage.getItem('teamflow_token')
  const raw = localStorage.getItem('teamflow_user')

  if (!token || !raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    clearStoredSession()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [demoMode, setDemoMode] = useState(false)
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem('teamflow_token')))

  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('teamflow_token')

    if (!token) {
      setAuthLoading(false)
      return undefined
    }

    api.me()
      .then((result) => {
        if (cancelled) return
        const liveUser = result.data
        localStorage.setItem('teamflow_user', JSON.stringify(liveUser))
        localStorage.removeItem('teamflow_demo')
        setUser(liveUser)
        setDemoMode(false)
      })
      .catch(() => {
        if (cancelled) return
        clearStoredSession()
        setUser(null)
        setDemoMode(false)
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (user && window.location.pathname === '/auth/login') {
      window.history.replaceState({}, '', '/')
    }
  }, [user])

  const login = async (credentials) => {
    const result = await api.login(credentials)
    localStorage.setItem('teamflow_token', result.data.token)
    localStorage.setItem('teamflow_user', JSON.stringify(result.data.user))
    localStorage.removeItem('teamflow_demo')
    setUser(result.data.user)
    setDemoMode(false)
    setAuthLoading(false)
    window.history.replaceState({}, '', '/')
    return result.data.user
  }

  const register = async (details) => {
    const result = await api.register(details)
    localStorage.setItem('teamflow_token', result.data.token)
    localStorage.setItem('teamflow_user', JSON.stringify(result.data.user))
    localStorage.removeItem('teamflow_demo')
    setUser(result.data.user)
    setDemoMode(false)
    setAuthLoading(false)
    window.history.replaceState({}, '', '/')
    return result.data.user
  }

  const enterDemo = () => {
    const demoUser = { id: 'demo-user', name: 'Swarnjeet Yadav', initials: 'SY', role: 'PROJECT_MANAGER' }
    clearStoredSession()
    setUser(demoUser)
    setDemoMode(true)
    setAuthLoading(false)
    window.history.replaceState({}, '', '/')
  }

  const logout = () => {
    clearStoredSession()
    setUser(null)
    setDemoMode(false)
    setAuthLoading(false)
    window.history.replaceState({}, '', '/')
  }

  const value = useMemo(
    () => ({ user, demoMode, authLoading, login, register, enterDemo, logout }),
    [user, demoMode, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
