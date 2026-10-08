import { useState } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { login, register, enterDemo } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setBusy(true)

    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password })
      } else {
        await login({ email: email.trim(), password })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode((current) => current === 'login' ? 'register' : 'login')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="login-shell">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <section className="login-card">
        <div className="login-brand">
          <span className="brand-mark">AN</span>
          <div><strong>Anvaya</strong><small>Smart project workspace</small></div>
        </div>

        <div className="login-copy">
          <span className="eyebrow">{isRegister ? 'New to Anvaya' : 'Welcome back'}</span>
          <h1>{isRegister ? 'Create your workspace account.' : 'Work with clarity.'}</h1>
          <p>{isRegister ? 'Create an account to start managing tasks and projects.' : 'Sign in to manage projects, tasks, ownership, and team workload.'}</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          {isRegister ? (
            <label className="field"><span>Full name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required /></label>
          ) : null}
          <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="8" required /></label>
          {isRegister ? (
            <label className="field"><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" minLength="8" required /></label>
          ) : null}
          {error ? <div className="login-error">{error}</div> : null}
          <button className="login-submit" type="submit" disabled={busy}><Icon name="spark" size={15} />{busy ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in')}</button>
        </form>

        <button className="auth-switch-button" type="button" onClick={switchMode}>
          {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>

        <div className="login-divider"><span>or</span></div>
        <button className="demo-button" type="button" onClick={enterDemo}>Preview demo workspace <span>→</span></button>

        <p className="login-note">
          {isRegister
            ? 'New accounts are created as Team Members. Project Manager/Admin access is controlled by the backend.'
            : 'Demo mode uses local mock data. Sign in uses the Anvaya API.'}
        </p>
      </section>

      <div className="login-footer"><span>Anvaya</span><span>Designed for focused team execution</span></div>
    </div>
  )
}
