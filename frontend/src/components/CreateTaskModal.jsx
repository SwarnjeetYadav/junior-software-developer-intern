import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import Avatar from './Avatar'
import { taskMembers as demoMembers } from '../data/teamflowMock'

const priorityValues = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH', Critical: 'CRITICAL' }

export default function CreateTaskModal({
  open,
  onClose,
  onCreate,
  projects = [],
  membersByProject = {},
  demoProject = null,
  liveMode = false,
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedProjectId((current) => current || projects[0]?._id || '')
  }, [open, projects])

  useEffect(() => {
    setAssigneeId('')
    setError('')
  }, [selectedProjectId])

  const selectedProject = projects.find((item) => item._id === selectedProjectId) || demoProject
  const options = liveMode
    ? (membersByProject[selectedProjectId] || [])
    : demoMembers

  const suggested = useMemo(
    () => [...options].sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0],
    [options],
  )

  if (!open) return null

  const submit = async (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('Task title is required')
      return
    }

    if (liveMode && !selectedProjectId) {
      setError('Select a project before adding tasks')
      return
    }

    setBusy(true)
    setError('')

    try {
      if (liveMode) {
        await onCreate({
          projectId: selectedProjectId,
          payload: {
            title: cleanTitle,
            description: '',
            priority: priorityValues[priority],
            dueDate: dueDate || null,
            ...(assigneeId ? { assigneeId } : {}),
          },
        })
      } else {
        const chosen = options.find((item) => item.id === assigneeId) || suggested
        await onCreate({
          id: 'TF-' + Math.floor(130 + Math.random() * 60),
          title: cleanTitle,
          project: selectedProject?.name || 'TeamFlow Web App',
          assignee: chosen?.initials || 'SY',
          assigneeName: chosen?.name || 'Swarnjeet Yadav',
          priority,
          status: 'Todo',
          due: dueDate || 'Not set',
        })
      }

      setTitle('')
      setPriority('Medium')
      setDueDate('')
      setAssigneeId('')
      setError('')
      setBusy(false)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">Quick create</span><h2 id="create-task-title">Create a task</h2><p>{selectedProject?.name || 'Select a project'}</p></div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close modal"><Icon name="close" size={18} /></button>
        </div>

        <form onSubmit={submit}>
          {liveMode ? (
            <label className="field">
              <span>Project</span>
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={busy}>
                <option value="">Select project</option>
                {projects.map((project) => <option value={project._id} key={project._id}>{project.name}</option>)}
              </select>
            </label>
          ) : null}

          <label className="field"><span>Task title</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Finalize sprint review report" /></label>
          <div className="field-grid">
            <label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label className="field"><span>Due date</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          </div>

          <div className="field">
            <span>Assignee</span>
            <div className="assignee-picker">
              {suggested ? (
                <button type="button" className={'assignee-option ' + (!assigneeId ? 'assignee-option-selected' : '')} onClick={() => setAssigneeId('')}>
                  <Icon name="spark" size={15} />
                  <div><strong>Smart suggestion</strong><small>{suggested.name} · {suggested.activeTasks || 0} active tasks</small></div>
                  <span className="smart-mark">SMART</span>
                </button>
              ) : (
                <div className="empty-assignee">No eligible project members yet. The backend will leave the task unassigned.</div>
              )}

              {options.map((member) => (
                <button type="button" key={member.id} className={'assignee-option ' + (assigneeId === member.id ? 'assignee-option-selected' : '')} onClick={() => setAssigneeId(member.id)}>
                  <Avatar initials={member.initials} color={member.tone || 'violet'} size="sm" />
                  <div><strong>{member.name}</strong><small>{member.activeTasks || 0} active tasks</small></div>
                  <span className="assignee-load">{member.activeTasks || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {error ? <div className="login-error">{error}</div> : null}
          <div className="modal-actions"><button type="button" className="ghost-dark-button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="primary-button primary-button-dark" disabled={busy}><Icon name="plus" size={15} /> {busy ? 'Creating...' : 'Create task'}</button></div>
        </form>
      </section>
    </div>
  )
}
