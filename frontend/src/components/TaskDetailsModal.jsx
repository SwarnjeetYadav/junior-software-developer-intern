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

export default function TaskDetailsModal({ task, open, liveMode, onClose, onChanged }) {
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState(task?.statusValue || 'TODO')
  const [loading, setLoading] = useState(false)
  const [commentBusy, setCommentBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !task || !liveMode || !task.apiId) return undefined

    let cancelled = false
    setLoading(true)
    setError('')

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

    setStatus(task.statusValue || 'TODO')
    return () => { cancelled = true }
  }, [open, task, liveMode])

  if (!open || !task) return null

  const updateStatus = async (nextStatus) => {
    if (!liveMode || !task.apiId) {
      setStatus(nextStatus)
      return
    }

    try {
      setStatus(nextStatus)
      await api.updateTask(task.apiId, { status: nextStatus })
      onChanged?.()
    } catch (err) {
      setError(err.message)
      setStatus(task.statusValue || 'TODO')
    }
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
          <div><span className="detail-label">Assignee</span><strong>{task.assigneeName || 'Unassigned'}</strong></div>
          <div><span className="detail-label">Priority</span><Badge color={task.priority === 'High' || task.priority === 'Critical' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'blue'}>{task.priority}</Badge></div>
          <div><span className="detail-label">Due</span><strong>{task.due}</strong></div>
        </div>

        <div className="field task-status-field">
          <span>Status</span>
          <select value={status} onChange={(event) => updateStatus(event.target.value)} disabled={!liveMode}>
            {statusLabels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </div>

        <div className="details-divider" />

        <div className="comments-section">
          <div className="section-header"><div><h2>Comments</h2><p>{liveMode ? 'Project members can collaborate directly on the task.' : 'Comments are available after API integration.'}</p></div></div>

          {loading ? <div className="comment-empty">Loading comments...</div> : comments.length ? (
            <div className="comment-list">
              {comments.map((item) => (
                <div className="comment-item" key={item._id}>
                  <Avatar initials={(item.userId?.name || 'TF').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()} color="violet" size="sm" />
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
