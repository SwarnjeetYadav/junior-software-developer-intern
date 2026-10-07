import { useMemo, useState } from 'react'
import Icon from './Icon'
import Avatar from './Avatar'
import { taskMembers } from '../data/teamflowMock'

export default function CreateTaskModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const suggested = useMemo(
    () => [...taskMembers].sort((a, b) => a.activeTasks - b.activeTasks)[0],
    [],
  )

  if (!open) return null

  const submit = (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    const member = taskMembers.find((item) => item.id === assigneeId)
    const chosen = member || suggested
    onCreate({
      id: 'TF-' + Math.floor(130 + Math.random() * 60),
      title: cleanTitle,
      project: 'TeamFlow Web App',
      assignee: chosen.initials,
      assigneeName: chosen.name,
      priority,
      status: 'Todo',
      due: dueDate || 'Not set',
    })
    setTitle('')
    setPriority('Medium')
    setDueDate('')
    setAssigneeId('')
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">Quick create</span><h2 id="create-task-title">Create a task</h2><p>Turn an idea into a clear, owned piece of work.</p></div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close modal"><Icon name="close" size={18} /></button>
        </div>

        <form onSubmit={submit}>
          <label className="field"><span>Task title</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finalize sprint review report" /></label>
          <div className="field-grid">
            <label className="field"><span>Priority</span><select value={priority} onChange={(e) => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label className="field"><span>Due date</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          </div>
          <div className="field">
            <span>Assignee</span>
            <div className="assignee-picker">
              <button type="button" className={'assignee-option ' + (!assigneeId ? 'assignee-option-selected' : '')} onClick={() => setAssigneeId('')}>
                <Icon name="spark" size={15} /><div><strong>Smart suggestion</strong><small>{suggested.name} · {suggested.activeTasks} active tasks</small></div><span className="smart-mark">AI</span>
              </button>
              {taskMembers.map((member) => (
                <button type="button" key={member.id} className={'assignee-option ' + (assigneeId === member.id ? 'assignee-option-selected' : '')} onClick={() => setAssigneeId(member.id)}>
                  <Avatar initials={member.initials} color={member.tone} size="sm" />
                  <div><strong>{member.name}</strong><small>{member.activeTasks} active tasks</small></div>
                  <span className="assignee-load">{member.activeTasks}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions"><button type="button" className="ghost-dark-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button primary-button-dark"><Icon name="plus" size={15} /> Create task</button></div>
        </form>
      </section>
    </div>
  )
}
