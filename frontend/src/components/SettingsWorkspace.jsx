import { useEffect, useState } from 'react'
import Badge from './Badge'
import Icon from './Icon'
import { api } from '../lib/api'

const NOTIFICATION_OPTIONS = [
  ['taskAssignment', 'Task assignments', 'Get notified when a task is assigned or reassigned to you.'],
  ['projectInvitation', 'Project invitations', 'Receive invitations and invitation status updates.'],
  ['chatMention', 'Team chat mentions', 'Get notified when someone mentions you in project chat.'],
  ['dependencyUnblocked', 'Dependency updates', 'Know when blocking work completes and your task can continue.'],
  ['teamUpdates', 'Team updates', 'Receive membership and project access updates.'],
]

export default function SettingsWorkspace({ user, projectCount = 0, taskCount = 0 }) {
  const [preferences, setPreferences] = useState(null)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getPreferences()
      .then((result) => {
        if (!cancelled) setPreferences(result.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.density = preferences?.display?.compactMode ? 'compact' : 'comfortable'
    return () => { delete document.documentElement.dataset.density }
  }, [preferences?.display?.compactMode])

  const updatePreference = async (section, key, value) => {
    const next = {
      ...preferences,
      [section]: { ...preferences[section], [key]: value },
    }
    setPreferences(next)
    setSaving(section + ':' + key)
    setMessage('')
    setError('')
    try {
      const result = await api.updatePreferences({ [section]: { [key]: value } })
      setPreferences(result.data)
      setMessage('Preference saved.')
    } catch (err) {
      setError(err.message)
      setPreferences((current) => current ? { ...current, [section]: { ...current[section], [key]: !value } } : current)
    } finally {
      setSaving('')
    }
  }

  if (!preferences) {
    return <div className="panel"><div className="workspace-inline-status">Loading account preferences...</div></div>
  }

  return (
    <div className="settings-workspace">
      <section className="panel settings-profile-panel">
        <div className="settings-profile">
          <div className="settings-avatar">{user?.name?.split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase() || 'AN'}</div>
          <div><span className="eyebrow">Account</span><h2>{user?.name || 'Account'}</h2><p>{user?.email || '—'} · {user?.role?.replaceAll('_', ' ') || 'User'}</p></div>
          <Badge color="green">Active</Badge>
        </div>
      </section>

      <div className="settings-grid">
        <section className="panel settings-preferences-panel">
          <div className="workspace-section-head"><div><span className="eyebrow">Notifications</span><h3>Keep the right signals</h3><p>Control the events that deserve an inbox notification.</p></div><Icon name="bell" size={19} /></div>
          <div className="preference-list">
            {NOTIFICATION_OPTIONS.map(([key, title, description]) => {
              const enabled = preferences.notifications?.[key] !== false
              return (
                <div className="preference-row" key={key}>
                  <div><strong>{title}</strong><p>{description}</p></div>
                  <button className={'preference-toggle ' + (enabled ? 'on' : '')} type="button" role="switch" aria-checked={enabled} onClick={() => updatePreference('notifications', key, !enabled)} disabled={saving === 'notifications:' + key}>
                    <span />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="workspace-section-head"><div><span className="eyebrow">Display</span><h3>Workspace density</h3><p>Keep the interface comfortable, especially on long work sessions.</p></div></div>
          <div className="density-card">
            <div><strong>Compact mode</strong><p>Reduce secondary spacing while keeping primary text and controls readable.</p></div>
            <button className={'preference-toggle ' + (preferences.display?.compactMode ? 'on' : '')} type="button" role="switch" aria-checked={Boolean(preferences.display?.compactMode)} onClick={() => updatePreference('display', 'compactMode', !preferences.display?.compactMode)} disabled={saving === 'display:compactMode'}><span /></button>
          </div>
          <div className="workspace-stats-card"><div><span>Visible projects</span><strong>{projectCount}</strong></div><div><span>Visible tasks</span><strong>{taskCount}</strong></div></div>
        </section>
      </div>

      {message ? <div className="success-banner">{message}</div> : null}
      {error ? <div className="workspace-error-banner">{error}</div> : null}
    </div>
  )
}
