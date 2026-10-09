import { useCallback, useEffect, useMemo, useState } from 'react'
import Avatar from './Avatar'
import Badge from './Badge'
import Icon from './Icon'
import { api } from '../lib/api'

const ROLE_OPTIONS = [
  ['PROJECT_MANAGER', 'Project Manager'],
  ['MEMBER', 'Team Member'],
  ['VIEWER', 'Viewer'],
]

function roleLabel(role) {
  return ROLE_OPTIONS.find(([value]) => value === role)?.[1] || role?.replaceAll('_', ' ') || 'Team Member'
}

function initialsFor(name = 'Anvaya') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function timeLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function chatReadKey(projectId) {
  return 'anvaya_chat_read_' + projectId
}

function getStoredReadAt(projectId) {
  try {
    return Number(localStorage.getItem(chatReadKey(projectId)) || 0)
  } catch {
    return 0
  }
}

function setStoredReadAt(projectId, value) {
  try {
    localStorage.setItem(chatReadKey(projectId), String(value))
  } catch {
    // Ignore storage restrictions; chat remains usable for the current session.
  }
}

function unreadCountFor(messages, currentUserId, readAt) {
  return messages.filter((item) => {
    const messageTime = new Date(item.createdAt).getTime()
    return Number.isFinite(messageTime)
      && messageTime > readAt
      && String(item.userId?._id) !== String(currentUserId)
  }).length
}

function ChatMessages({ messages, currentUserId, loading }) {
  if (loading && !messages.length) {
    return <div className="comment-empty team-chat-loading-state">Loading team conversation...</div>
  }

  if (!loading && !messages.length) {
    return <div className="comment-empty team-chat-loading-state">No messages yet. Start the conversation for this project.</div>
  }

  return messages.map((item) => {
    const ownMessage = String(item.userId?._id) === String(currentUserId)

    return (
      <div className={'team-chat-message ' + (ownMessage ? 'team-chat-message-self' : '')} key={item._id}>
        <Avatar initials={initialsFor(item.userId?.name)} color={ownMessage ? 'violet' : 'blue'} size="sm" />
        <div>
          <div className="team-chat-message-head">
            <strong>{item.userId?.name || 'Team member'}</strong>
            <span>{timeLabel(item.createdAt)}</span>
          </div>
          <p>{item.message}</p>
        </div>
      </div>
    )
  })
}

export default function TeamWorkspace({ projects, membersByProject, currentUserId, currentUser, onChanged }) {
  const [projectId, setProjectId] = useState(projects[0]?._id || '')
  const [query, setQuery] = useState('')
  const [projectRole, setProjectRole] = useState('MEMBER')
  const [projectInvitations, setProjectInvitations] = useState([])
  const [candidates, setCandidates] = useState([])
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [chat, setChat] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatFullscreen, setChatFullscreen] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (!projectId && projects[0]?._id) setProjectId(projects[0]._id)
    if (projectId && !projects.some((project) => project._id === projectId)) {
      setProjectId(projects[0]?._id || '')
    }
  }, [projects, projectId])

  const selectedProject = projects.find((project) => project._id === projectId)
  const currentMembers = membersByProject?.[projectId] || []

  const currentMembership = currentMembers.find(
    (member) => String(member.id) === String(currentUserId),
  )

  const canManage = currentUser?.role === 'ADMINISTRATOR'
    || String(selectedProject?.ownerId) === String(currentUserId)
    || currentMembership?.projectRole === 'PROJECT_MANAGER'

  const memberStats = useMemo(() => ({
    total: currentMembers.length,
    managers: currentMembers.filter((member) => member.projectRole === 'PROJECT_MANAGER' || String(member.id) === String(selectedProject?.ownerId)).length,
    contributors: currentMembers.filter((member) => member.projectRole === 'MEMBER').length,
    viewers: currentMembers.filter((member) => member.projectRole === 'VIEWER').length,
  }), [currentMembers, selectedProject])

  useEffect(() => {
    setCandidates([])
    setMessage('')
    setError('')

    const term = query.trim()
    if (term.length < 2 || !projectId || !canManage) return undefined

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const result = await api.searchMemberCandidates(projectId, term)
        if (!cancelled) setCandidates(result.data || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, projectId, canManage])

  const loadChat = useCallback(async ({ preserveUnread = false } = {}) => {
    if (!projectId) return

    setChatLoading(true)
    try {
      const result = await api.listProjectChat(projectId)
      const messages = result.data || []
      setChat(messages)

      const latestTime = messages.length
        ? new Date(messages[messages.length - 1].createdAt).getTime()
        : 0
      const storedReadAt = getStoredReadAt(projectId)

      if (chatOpen || !preserveUnread) {
        const readAt = Math.max(storedReadAt, latestTime)
        setStoredReadAt(projectId, readAt)
        setChatUnread(0)
      } else {
        if (!storedReadAt && latestTime) {
          setStoredReadAt(projectId, latestTime)
          setChatUnread(0)
        } else {
          setChatUnread(unreadCountFor(messages, currentUserId, storedReadAt))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setChatLoading(false)
    }
  }, [projectId, currentUserId, chatOpen])

  useEffect(() => {
    if (!projectId) return undefined
    loadChat({ preserveUnread: true })

    const interval = window.setInterval(() => {
      loadChat({ preserveUnread: true })
    }, 8000)

    return () => window.clearInterval(interval)
  }, [projectId, loadChat])

  useEffect(() => {
    if (!projectId || !canManage) {
      setProjectInvitations([])
      return undefined
    }

    let cancelled = false
    api.listProjectInvitations(projectId)
      .then((result) => {
        if (!cancelled) setProjectInvitations(result.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => { cancelled = true }
  }, [projectId, canManage])

  useEffect(() => {
    if (!chatOpen || !projectId) return
    const latest = chat.length ? new Date(chat[chat.length - 1].createdAt).getTime() : Date.now()
    setStoredReadAt(projectId, latest)
    setChatUnread(0)
  }, [chatOpen, projectId])

  useEffect(() => {
    if (!chatFullscreen || !chatOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [chatFullscreen, chatOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && chatOpen) {
        setChatFullscreen(false)
        setChatOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatOpen])

  const add = async (member) => {
    setBusyId(member._id)
    setError('')
    setMessage('')
    try {
      await api.addMember(projectId, member._id, projectRole)
      setMessage(member.name + ' added as ' + roleLabel(projectRole) + '.')
      setCandidates((items) => items.filter((item) => item._id !== member._id))
      setQuery('')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const invite = async (member) => {
    setBusyId(member._id)
    setError('')
    setMessage('')
    try {
      await api.createProjectInvitation(projectId, member._id, projectRole)
      setMessage(member.name + ' was invited as ' + roleLabel(projectRole) + '.')
      setCandidates((items) => items.filter((item) => item._id !== member._id))
      setQuery('')
      const result = await api.listProjectInvitations(projectId)
      setProjectInvitations(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const changeRole = async (member, nextRole) => {
    setBusyId(member.id)
    setError('')
    setMessage('')
    try {
      await api.updateMemberRole(projectId, member.id, nextRole)
      setMessage(member.name + ' is now a ' + roleLabel(nextRole) + '.')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const remove = async (member) => {
    if (!window.confirm('Remove ' + member.name + ' from ' + selectedProject?.name + '?')) return

    setBusyId(member.id)
    setError('')
    setMessage('')
    try {
      await api.removeMember(projectId, member.id)
      setMessage(member.name + ' was removed from the project.')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const sendChat = async (event) => {
    event.preventDefault()
    const clean = chatMessage.trim()
    if (!clean || !projectId) return

    setChatSending(true)
    setError('')
    try {
      const result = await api.sendProjectChat(projectId, clean)
      const nextMessage = result.data
      setChat((items) => [...items, nextMessage])
      setChatMessage('')
      setStoredReadAt(projectId, new Date(nextMessage.createdAt).getTime())
      setChatUnread(0)
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setChatSending(false)
    }
  }

  const openChat = () => {
    setChatOpen(true)
    setChatFullscreen(false)
    setStoredReadAt(projectId, chat.length ? new Date(chat[chat.length - 1].createdAt).getTime() : Date.now())
    setChatUnread(0)
  }

  const minimizeChat = () => {
    setChatFullscreen(false)
    setChatOpen(false)
  }

  return (
    <div className="team-workspace">
      <div className="team-workspace-toolbar">
        <div>
          <span className="eyebrow">Team workspace</span>
          <h2>Manage your project team</h2>
          <p>Add teammates, control project permissions, and keep the team conversation in one place.</p>
        </div>
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Select project team">
          {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
        </select>
      </div>

      {selectedProject ? (
        <>
          <div className="team-metrics">
            <div><strong>{memberStats.total}</strong><span>Team members</span></div>
            <div><strong>{memberStats.managers}</strong><span>Project managers</span></div>
            <div><strong>{memberStats.contributors}</strong><span>Contributors</span></div>
            <div><strong>{memberStats.viewers}</strong><span>Viewers</span></div>
          </div>

          {!canManage ? (
            <div className="permission-notice">
              <Icon name="settings" size={15} />
              <div><strong>Project permissions are managed by the owner or project manager.</strong><span>You can still see the team and use project chat.</span></div>
            </div>
          ) : null}

          <div className="team-management-grid">
            <section className="panel">
              <div className="team-section-head">
                <div><span className="eyebrow">Membership</span><h3>Current team</h3><p>Manage access for people in {selectedProject.name}.</p></div>
                <Badge color={canManage ? 'green' : 'blue'}>{canManage ? 'Manager access' : 'Read access'}</Badge>
              </div>

              <div className="team-member-list">
                {currentMembers.length ? currentMembers.map((member) => {
                  const owner = String(member.id) === String(selectedProject.ownerId)
                  const self = String(member.id) === String(currentUserId)
                  const memberBusy = busyId === member.id

                  return (
                    <div className="team-member-row" key={member.memberId || member.id}>
                      <Avatar initials={member.initials} color={member.tone} size="sm" />
                      <div className="team-member-main">
                        <div><strong>{member.name}</strong>{owner ? <Badge color="violet">Owner</Badge> : null}</div>
                        <small>{member.email}</small>
                      </div>
                      <select
                        className="team-role-select"
                        value={owner ? 'PROJECT_MANAGER' : (member.projectRole || 'MEMBER')}
                        disabled={!canManage || owner || self || memberBusy}
                        onChange={(event) => changeRole(member, event.target.value)}
                        aria-label={'Project role for ' + member.name}
                      >
                        {ROLE_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                      {owner ? (
                        <span className="team-protected">Protected</span>
                      ) : canManage ? (
                        <button className="danger-outline-button" type="button" onClick={() => remove(member)} disabled={memberBusy || self}>
                          {memberBusy ? 'Saving...' : 'Remove'}
                        </button>
                      ) : null}
                    </div>
                  )
                }) : <div className="empty-state">No members have been added to this project yet.</div>}
              </div>
            </section>

            <section className="panel">
              <div className="team-section-head">
                <div><span className="eyebrow">Access control</span><h3>Add a teammate</h3><p>Search active Anvaya users and give them project-specific access.</p></div>
              </div>

              {canManage ? (
                <>
                  <div className="team-add-controls">
                    <input className="member-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email..." aria-label="Search users to add" />
                    <select value={projectRole} onChange={(event) => setProjectRole(event.target.value)} aria-label="New member project role">
                      {ROLE_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </div>
                  {searching ? <div className="comment-empty">Searching users...</div> : null}
                  {!searching && query.trim().length >= 2 && !candidates.length ? <div className="comment-empty">No active users available.</div> : null}
                  <div className="team-candidate-list">
                    {candidates.map((member) => (
                      <div className="team-candidate-row" key={member._id}>
                        <Avatar initials={initialsFor(member.name)} color="violet" size="sm" />
                        <div><strong>{member.name}</strong><small>{member.email} · {roleLabel(member.role)}</small></div>
                        <div className="candidate-actions">
                          <button className="small-action-button" type="button" onClick={() => add(member)} disabled={busyId === member._id}>{busyId === member._id ? 'Adding...' : 'Add now'}</button>
                          <button className="secondary-small-button" type="button" onClick={() => invite(member)} disabled={busyId === member._id}>Invite</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="permission-cards">
                    <div><strong>Project Manager</strong><span>Manage members, roles, tasks, and project work.</span></div>
                    <div><strong>Team Member</strong><span>Create and update tasks, collaborate, and use chat.</span></div>
                    <div><strong>Viewer</strong><span>Read project work without changing tasks.</span></div>
                  </div>
                  <div className="pending-invitations-panel">
                    <div className="workspace-section-head"><div><span className="eyebrow">Onboarding</span><h4>Pending invitations</h4><p>Invites expire after 7 days and never create duplicate memberships.</p></div><Badge color={projectInvitations.length ? 'violet' : 'neutral'}>{projectInvitations.length} pending</Badge></div>
                    {projectInvitations.length ? projectInvitations.filter((item) => item.status === 'PENDING').map((item) => (
                      <div className="pending-invitation-row" key={item._id}>
                        <div><strong>{item.invitedUserId?.name || 'User'}</strong><small>{item.invitedUserId?.email || ''} · {roleLabel(item.projectRole)}</small></div>
                        <span>Expires {new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )) : <div className="detail-empty">No pending invitations for this project.</div>}
                  </div>
                </>
              ) : (
                <div className="permission-summary">
                  <div><strong>Your project role</strong><span>{String(selectedProject.ownerId) === String(currentUserId) ? 'Owner' : roleLabel(currentMembership?.projectRole)}</span></div>
                  <div><strong>Access</strong><span>{String(selectedProject.ownerId) === String(currentUserId) || currentMembership?.projectRole !== 'VIEWER' ? 'Collaborative' : 'Read only'}</span></div>
                  <div><strong>Management</strong><span>Owner / project managers only</span></div>
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="empty-state">No project is available for team management yet.</div>
      )}

      {message ? <div className="success-banner">{message}</div> : null}
      {error ? <div className="login-error">{error}</div> : null}

      {selectedProject ? (
        <>
          {chatOpen && chatFullscreen ? <div className="team-chat-backdrop" onClick={minimizeChat} aria-hidden="true" /> : null}

          {!chatOpen ? (
            <button
              className="team-chat-launcher"
              type="button"
              onClick={openChat}
              aria-label={'Open ' + selectedProject.name + ' team chat'}
              title="Open team chat"
            >
              <Icon name="chat" size={24} stroke={1.8} />
              {chatUnread > 0 ? <span className="team-chat-unread">{chatUnread > 99 ? '99+' : chatUnread}</span> : null}
              <span className="sr-only">Open team chat</span>
            </button>
          ) : (
            <aside className={'team-chat-drawer ' + (chatFullscreen ? 'team-chat-drawer-fullscreen' : '')} aria-label="Team chat">
              <div className="team-chat-drawer-header">
                <div className="team-chat-drawer-title">
                  <div className="team-chat-drawer-icon"><Icon name="chat" size={17} /></div>
                  <div>
                    <strong>Team chat</strong>
                    <span>{selectedProject.name}</span>
                  </div>
                </div>

                <div className="team-chat-drawer-actions">
                  <button type="button" className="team-chat-icon-button" onClick={() => loadChat({ preserveUnread: true })} disabled={chatLoading} aria-label="Refresh team chat" title="Refresh chat">
                    <Icon name="refresh" size={16} />
                  </button>
                  <button
                    type="button"
                    className="team-chat-icon-button"
                    onClick={() => setChatFullscreen((value) => !value)}
                    aria-label={chatFullscreen ? 'Exit full screen chat' : 'Open full screen chat'}
                    title={chatFullscreen ? 'Exit full screen' : 'Full screen'}
                  >
                    <Icon name={chatFullscreen ? 'minimize' : 'expand'} size={16} />
                  </button>
                  <button type="button" className="team-chat-icon-button team-chat-close-button" onClick={minimizeChat} aria-label="Minimize chat" title="Minimize chat">
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </div>

              <div className="team-chat-drawer-meta">
                <div>
                  <span>{currentMembers.length} member{currentMembers.length === 1 ? '' : 's'}</span>
                  <i />
                  <span>{selectedProject.status?.replaceAll('_', ' ') || 'Active'}</span>
                </div>
                <small>Messages are shared with this project team.</small>
              </div>

              <div className="team-chat-drawer-messages">
                <ChatMessages messages={chat} currentUserId={currentUserId} loading={chatLoading} />
              </div>

              <form className="team-chat-drawer-form" onSubmit={sendChat}>
                <input
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Message your project team..."
                  maxLength={2000}
                  aria-label="Team chat message"
                />
                <button
                  className="team-chat-send-button"
                  type="submit"
                  disabled={chatSending || !chatMessage.trim()}
                  aria-label="Send message"
                  title="Send message"
                >
                  <Icon name="send" size={16} />
                </button>
              </form>
              <div className="team-chat-drawer-footer">Press Esc to minimize · Auto-refresh every 8 seconds</div>
            </aside>
          )}
        </>
      ) : null}
    </div>
  )
}
