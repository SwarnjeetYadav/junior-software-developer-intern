import { useState } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { login, enterDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <section className="login-card">
        <div className="login-brand">
          <span className="brand-mark">TF</span>
          <div><strong>TeamFlow</strong><small>Smart project workspace</small></div>
        </div>

        <div className="login-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>Work with clarity.</h1>
          <p>Sign in to manage projects, tasks, ownership, and team workload.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="login-submit" type="submit" disabled={busy}><Icon name="spark" size={15} />{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>

        <div className="login-divider"><span>or</span></div>
        <button className="demo-button" type="button" onClick={enterDemo}>Preview demo workspace <span>→</span></button>

        <p className="login-note">Demo mode uses local mock data. Sign in uses the TeamFlow API.</p>
      </section>

      <div className="login-footer"><span>TeamFlow</span><span>Designed for focused team execution</span></div>
    </div>
  )
}
