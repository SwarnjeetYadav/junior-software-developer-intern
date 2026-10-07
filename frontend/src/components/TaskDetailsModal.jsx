import { useEffect, useState } from 'react'
import Icon from './Icon'
import Avatar from './Avatar'
import Badge from './Badge'
import { api } from '../lib/api'

const statusLabels = [
  ['TODO', 'Todo'],
  ['IN_PROGRESS', 'In Progress'],
  ['REVIEW', 'Review'],
  ['BLOCKED', 'Blocked'],
  ['COMPLETED', 'Completed'],
]
const priorityOptions = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['CRITICAL', 'Critical'],
]

function memberInitials(name = 'TF') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function TaskDetailsModal({ task, open, liveMode, projectMembers = [], onClose, onChanged }) {
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState(task?.statusValue || 'TODO')
  const [priority, setPriority] = useState(task?.priorityValue || 'MEDIUM')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '')
  const [dueDate, setDueDate] = useState(task?.dueDate ? String(task.dueDate).slice(0, 10) : '')
  const [loading, setLoading] = useState(false)
  const [commentBusy, setCommentBusy] = useState(false)
  const [savingField, setSavingField] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !task) return undefined

    setStatus(task.statusValue || 'TODO')
    setPriority(task.priorityValue || 'MEDIUM')
    setAssigneeId(task.assigneeId || '')
    setDueDate(task.dueDate ? String(task.dueDate).slice(0, 10) : '')
    setComment('')
    setError('')

    if (!liveMode || !task.apiId) {
      setComments([])
      return undefined
    }

    let cancelled = false
    setLoading(true)

    api.listComments(task.apiId)
      .then((result) => {
        if (!cancelled) setComments(result.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [open, task, liveMode])

  if (!open || !task) return null

  const saveField = async (field, value) => {
    if (!liveMode || !task.apiId) return

    setSavingField(field)
    setError('')
    try {
      await api.updateTask(task.apiId, { [field]: value })
      onChanged?.()
    } catch (err) {
      setError(err.message)
      if (field === 'status') setStatus(task.statusValue || 'TODO')
      if (field === 'priority') setPriority(task.priorityValue || 'MEDIUM')
      if (field === 'assigneeId') setAssigneeId(task.assigneeId || '')
      if (field === 'dueDate') setDueDate(task.dueDate ? String(task.dueDate).slice(0, 10) : '')
    } finally {
      setSavingField('')
    }
  }

  const updateStatus = async (nextStatus) => {
    setStatus(nextStatus)
    await saveField('status', nextStatus)
  }

  const updatePriority = async (nextPriority) => {
    setPriority(nextPriority)
    await saveField('priority', nextPriority)
  }

  const updateAssignee = async (nextAssignee) => {
    setAssigneeId(nextAssignee)
    await saveField('assigneeId', nextAssignee || null)
  }

  const updateDueDate = async (nextDueDate) => {
    setDueDate(nextDueDate)
    await saveField('dueDate', nextDueDate || null)
  }

  const submitComment = async (event) => {
    event.preventDefault()
    const message = comment.trim()
    if (!message || !liveMode || !task.apiId) return

    setCommentBusy(true)
    setError('')

    try {
      const result = await api.addComment(task.apiId, message)
      setComments((current) => [...current, result.data])
      setComment('')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setCommentBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="task-modal task-details-modal" role="dialog" aria-modal="true" aria-labelledby="task-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Task details</span>
            <h2 id="task-details-title">{task.title}</h2>
            <p>{task.project} · {task.id}</p>
          </div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close details"><Icon name="close" size={18} /></button>
        </div>

        <div className="task-detail-meta">
          <div>
            <span className="detail-label">Assignee</span>
            <strong>{task.assigneeName || 'Unassigned'}</strong>
          </div>
          <div>
            <span className="detail-label">Priority</span>
            <Badge color={task.priority === 'High' || task.priority === 'Critical' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'blue'}>{task.priority}</Badge>
          </div>
          <div><span className="detail-label">Due</span><strong>{task.due}</strong></div>
        </div>

        {liveMode ? (
          <div className="field-grid task-edit-grid">
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(event) => updateStatus(event.target.value)} disabled={savingField === 'status'}>
                {statusLabels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={priority} onChange={(event) => updatePriority(event.target.value)} disabled={savingField === 'priority'}>
                {priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Assignee</span>
              <select value={assigneeId} onChange={(event) => updateAssignee(event.target.value)} disabled={savingField === 'assigneeId'}>
                <option value="">Unassigned</option>
                {projectMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input type="date" value={dueDate} onChange={(event) => updateDueDate(event.target.value)} disabled={savingField === 'dueDate'} />
            </label>
          </div>
        ) : (
          <div className="field task-status-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="TODO">Todo</option><option value="IN_PROGRESS">In Progress</option><option value="REVIEW">Review</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option></select></div>
        )}

        {task.description ? <div className="task-description-block"><span className="detail-label">Description</span><p>{task.description}</p></div> : null}

        <div className="details-divider" />

        <div className="comments-section">
          <div className="section-header"><div><h2>Comments</h2><p>{liveMode ? 'Project members can collaborate directly on the task.' : 'Comments are available after API integration.'}</p></div></div>

          {loading ? <div className="comment-empty">Loading comments...</div> : comments.length ? (
            <div className="comment-list">
              {comments.map((item) => (
                <div className="comment-item" key={item._id}>
                  <Avatar initials={memberInitials(item.userId?.name)} color="violet" size="sm" />
                  <div><strong>{item.userId?.name || 'Team member'}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div>
                </div>
              ))}
            </div>
          ) : <div className="comment-empty">No comments yet. Start the conversation.</div>}

          {liveMode ? (
            <form className="comment-form" onSubmit={submitComment}>
              <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." />
              <button className="primary-button primary-button-dark" type="submit" disabled={commentBusy}>{commentBusy ? 'Posting...' : 'Post'}</button>
            </form>
          ) : null}
        </div>

        {error ? <div className="login-error">{error}</div> : null}
      </section>
    </div>
  )
}
