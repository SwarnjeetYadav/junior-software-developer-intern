import { useEffect, useMemo, useState } from 'react'
import Badge from './Badge'
import Icon from './Icon'
import TaskTable from './TaskTable'
import { api } from '../lib/api'

const VIEWS = [
  ['overview', 'Overview'],
  ['board', 'Board'],
  ['list', 'List'],
  ['calendar', 'Calendar'],
  ['timeline', 'Timeline'],
  ['activity', 'Activity'],
]

const STATUS_COLUMNS = [
  ['TODO', 'Todo'],
  ['IN_PROGRESS', 'In Progress'],
  ['REVIEW', 'Review'],
  ['BLOCKED', 'Blocked'],
  ['COMPLETED', 'Completed'],
]

function dueState(task) {
  if (!task.dueDate || task.statusValue === 'COMPLETED') return 'neutral'
  const diff = new Date(task.dueDate).getTime() - Date.now()
  if (diff < 0) return 'danger'
  if (diff <= 48 * 36e5) return 'warning'
  return 'neutral'
}

function dueLabel(task) {
  if (!task.dueDate) return 'No due date'
  const date = new Date(task.dueDate)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function localDateKey(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function startOfWeek(value) {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatMonth(value) {
  return value.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function BoardCard({ task, onOpen, onDragStart }) {
  const due = dueState(task)
  return (
    <article
      className="kanban-card"
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      onClick={() => onOpen?.(task)}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && onOpen) {
          event.preventDefault()
          onOpen(task)
        }
      }}
      tabIndex={0}
    >
      <div className="kanban-card-top">
        <Badge color={task.priority === 'Critical' || task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'blue'}>{task.priority}</Badge>
        {task.dependencyCount ? <span className="dependency-chip"><Icon name="link" size={13} /> {task.dependencyCount}</span> : null}
      </div>
      <h4>{task.title}</h4>
      <div className="kanban-card-meta">
        <span className={due === 'danger' ? 'due-risk-danger' : due === 'warning' ? 'due-risk-warning' : ''}><Icon name="calendar" size={13} /> {dueLabel(task)}</span>
        <span><Icon name="users" size={13} /> {task.assigneeName || 'Unassigned'}</span>
      </div>
      {task.hasBlockingDependencies ? <div className="blocker-banner"><Icon name="alert" size={13} /> Blocked by predecessor work</div> : null}
    </article>
  )
}

export default function ProjectWorkspace({
  project,
  tasks = [],
  members = [],
  currentUserId,
  onSelectTask,
  onCreateTask,
  onCreateTaskForDate,
  onRefresh,
  onOpenTeam,
}) {
  const viewKey = 'anvaya_project_view_' + String(currentUserId) + '_' + String(project?._id || '')
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(viewKey) || 'overview' } catch { return 'overview' }
  })
  const [movingTaskId, setMovingTaskId] = useState('')
  const [filter, setFilter] = useState('')
  const [calendarCursor, setCalendarCursor] = useState(new Date())
  const [calendarMode, setCalendarMode] = useState('month')
  const [analytics, setAnalytics] = useState(null)
  const [insights, setInsights] = useState([])
  const [activity, setActivity] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [metaError, setMetaError] = useState('')

  useEffect(() => {
    try { localStorage.setItem(viewKey, view) } catch { /* storage may be unavailable */ }
  }, [view, viewKey])

  useEffect(() => {
    if (!project?._id) return undefined
    let cancelled = false
    setLoadingMeta(true)
    setMetaError('')

    Promise.all([
      api.getProjectAnalytics(project._id),
      api.getProjectInsights(project._id),
      api.listProjectActivity(project._id),
    ])
      .then(([analyticsResult, insightsResult, activityResult]) => {
        if (cancelled) return
        setAnalytics(analyticsResult.data || null)
        setInsights(insightsResult.data || [])
        setActivity(activityResult.data || [])
      })
      .catch((error) => {
        if (!cancelled) setMetaError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false)
      })

    return () => { cancelled = true }
  }, [project?._id, tasks.length])

  const visibleTasks = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return tasks
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(query)
      || (task.assigneeName || '').toLowerCase().includes(query)
      || task.status.toLowerCase().includes(query),
    )
  }, [tasks, filter])

  const handleView = (nextView) => setView(nextView)

  const moveTask = async (taskId, status) => {
    if (!taskId || !status || movingTaskId) return
    setMovingTaskId(taskId)
    setMetaError('')
    try {
      await api.updateTask(taskId, { status })
      onRefresh?.()
    } catch (error) {
      setMetaError(error.message)
    } finally {
      setMovingTaskId('')
    }
  }

  const filteredBoard = useMemo(() => {
    const groups = new Map(STATUS_COLUMNS.map(([status]) => [status, []]))
    visibleTasks.forEach((task) => {
      if (!groups.has(task.statusValue)) groups.set(task.statusValue, [])
      groups.get(task.statusValue).push(task)
    })
    return groups
  }, [visibleTasks])

  const dateGroups = useMemo(() => {
    const groups = new Map()
    visibleTasks.filter((task) => task.dueDate).forEach((task) => {
      const key = localDateKey(task.dueDate)
      groups.set(key, [...(groups.get(key) || []), task])
    })
    return groups
  }, [visibleTasks])

  const calendarDates = useMemo(() => {
    if (calendarMode === 'week') {
      const start = startOfWeek(calendarCursor)
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        return date
      })
    }

    const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1)
    const last = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 0)
    const mondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1
    const dates = []
    for (let index = 0; index < mondayOffset; index += 1) {
      const date = new Date(first)
      date.setDate(first.getDate() - mondayOffset + index)
      dates.push(date)
    }
    for (let day = 1; day <= last.getDate(); day += 1) {
      dates.push(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day))
    }
    while (dates.length < 42) {
      const date = new Date(dates[dates.length - 1])
      date.setDate(date.getDate() + 1)
      dates.push(date)
    }
    return dates
  }, [calendarCursor, calendarMode])

  const timelineRows = useMemo(() => {
    const dated = visibleTasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        task,
        start: new Date(task.createdAt || task.dueDate).getTime(),
        end: new Date(task.dueDate).getTime(),
      }))
    if (!dated.length) return []
    const min = Math.min(...dated.map((item) => item.start))
    const max = Math.max(...dated.map((item) => Math.max(item.end, item.start + 864e5)))
    return dated.map((item) => ({
      ...item,
      left: max === min ? 0 : ((item.start - min) / (max - min)) * 100,
      width: Math.max(3, max === min ? 100 : ((Math.max(item.end, item.start + 864e5) - item.start) / (max - min)) * 100),
    }))
  }, [visibleTasks])

  if (!project) return null

  const completed = visibleTasks.filter((task) => task.statusValue === 'COMPLETED').length
  const blocked = visibleTasks.filter((task) => task.hasBlockingDependencies || task.statusValue === 'BLOCKED').length
  const dueSoon = visibleTasks.filter((task) => dueState(task) === 'warning' || dueState(task) === 'danger').length
  const completion = visibleTasks.length ? Math.round((completed / visibleTasks.length) * 100) : 0

  return (
    <section className="project-workspace">
      <div className="project-workspace-header">
        <div>
          <span className="eyebrow">Project workspace</span>
          <div className="project-workspace-title-row">
            <h2>{project.name}</h2>
            <Badge color={project.status === 'COMPLETED' ? 'green' : project.status === 'ON_HOLD' ? 'amber' : 'violet'}>{project.status?.replaceAll('_', ' ') || 'ACTIVE'}</Badge>
          </div>
          <p>{project.description || 'Keep project work, ownership, deadlines and blockers visible from one focused workspace.'}</p>
        </div>
        <div className="project-workspace-actions">
          <button className="secondary-button" type="button" onClick={onOpenTeam}><Icon name="users" size={15} /> Manage team</button>
          <button className="primary-button primary-button-dark" type="button" onClick={onCreateTask}><Icon name="plus" size={15} /> New task</button>
        </div>
      </div>

      <div className="project-view-switcher" role="tablist" aria-label="Project views">
        {VIEWS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={view === value} className={view === value ? 'project-view-tab project-view-tab-active' : 'project-view-tab'} onClick={() => handleView(value)}>
            {label}
          </button>
        ))}
        <div className="project-view-filter">
          <Icon name="search" size={15} />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter project work..." aria-label="Filter project work" />
        </div>
      </div>

      {loadingMeta && !analytics ? <div className="workspace-inline-status">Refreshing project intelligence...</div> : null}
      {metaError ? <div className="workspace-error-banner">{metaError}</div> : null}

      {view === 'overview' ? (
        <div className="project-overview-layout">
          <div className="project-overview-main">
            <div className="project-kpi-grid">
              <div className="project-kpi"><span>Tracked tasks</span><strong>{visibleTasks.length}</strong><small>Current project workload</small></div>
              <div className="project-kpi"><span>Completion</span><strong>{completion}%</strong><small>{completed} completed</small></div>
              <div className="project-kpi"><span>Due risk</span><strong>{dueSoon}</strong><small>{blocked} blocked / at risk</small></div>
              <div className="project-kpi"><span>Team</span><strong>{members.length}</strong><small>Active project members</small></div>
            </div>

            <div className="panel">
              <div className="workspace-section-head"><div><span className="eyebrow">Action queue</span><h3>What needs attention?</h3><p>Focus on blocked and near-term work before lower-risk tasks.</p></div></div>
              <div className="attention-list">
                {visibleTasks.filter((task) => dueState(task) !== 'neutral' || task.hasBlockingDependencies).slice(0, 6).map((task) => (
                  <button className="attention-row" type="button" key={task.apiId} onClick={() => onSelectTask?.(task)}>
                    <span className="attention-icon"><Icon name={task.hasBlockingDependencies ? 'alert' : 'calendar'} size={15} /></span>
                    <span><strong>{task.title}</strong><small>{task.hasBlockingDependencies ? 'Blocked by dependency · ' : ''}{dueLabel(task)}</small></span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
                {!visibleTasks.some((task) => dueState(task) !== 'neutral' || task.hasBlockingDependencies) ? <div className="empty-state">No urgent signals. The project is currently clear.</div> : null}
              </div>
            </div>
          </div>
          <aside className="project-overview-side">
            <div className="panel insight-panel">
              <div className="workspace-section-head"><div><span className="eyebrow">Anvaya Insights</span><h3>Project health</h3></div></div>
              {insights.length ? insights.map((insight) => (
                <button className="insight-card" type="button" key={insight.type} onClick={() => {
                  const task = visibleTasks.find((item) => String(insight.entityIds?.[0]) === String(item.apiId))
                  if (task) onSelectTask?.(task)
                }}>
                  <div className="insight-card-head"><Badge color={insight.severity === 'HIGH' ? 'rose' : insight.severity === 'MEDIUM' ? 'amber' : 'green'}>{insight.signal}</Badge><Icon name="chevron" size={15} /></div>
                  <strong>{insight.reason}</strong>
                  <span>{insight.action}</span>
                </button>
              )) : <div className="empty-state">No current risk signals.</div>}
            </div>

            <div className="panel">
              <div className="workspace-section-head"><div><span className="eyebrow">Delivery</span><h3>Project performance</h3></div></div>
              <div className="delivery-metric"><strong>{analytics?.medianCycleTimeHours || 0}h</strong><span>median cycle time</span></div>
              <div className="delivery-metric"><strong>{analytics?.throughput?.reduce((sum, item) => sum + item.completed, 0) || 0}</strong><span>completed in recent weeks</span></div>
              <div className="workload-mini-list">
                {(analytics?.workload || []).map((item) => {
                  const member = members.find((candidate) => String(candidate.id) === String(item.userId))
                  return <div key={item.userId}><span>{member?.name || 'Team member'}</span><div><i style={{ width: Math.min(100, item.activeTasks * 12) + '%' }} /></div><strong>{item.activeTasks}</strong></div>
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {view === 'board' ? (
        <div className="kanban-board" aria-label="Project task board">
          {STATUS_COLUMNS.map(([status, label]) => {
            const items = filteredBoard.get(status) || []
            return (
              <section className={'kanban-column ' + (movingTaskId ? 'kanban-column-ready' : '')} key={status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const id = event.dataTransfer.getData('text/task-id')
                  if (id) moveTask(id, status)
                }}
              >
                <header><div><strong>{label}</strong><span>{items.length}</span></div>{status === 'IN_PROGRESS' && items.length >= 6 ? <Badge color="amber">High load</Badge> : null}</header>
                <div className="kanban-card-list">
                  {items.map((task) => <BoardCard key={task.apiId} task={task} onOpen={onSelectTask} onDragStart={(event, value) => event.dataTransfer.setData('text/task-id', value.apiId)} />)}
                  {!items.length ? <div className="kanban-empty">Drop a task here</div> : null}
                </div>
              </section>
            )
          })}
        </div>
      ) : null}

      {view === 'list' ? (
        <div className="panel">
          <div className="workspace-section-head"><div><span className="eyebrow">List view</span><h3>Project work queue</h3><p>Table view remains the most precise editing surface.</p></div></div>
          <TaskTable tasks={visibleTasks} onSelectTask={onSelectTask} />
        </div>
      ) : null}

      {view === 'calendar' ? (
        <div className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div><span className="eyebrow">Calendar</span><h3>{calendarMode === 'month' ? formatMonth(calendarCursor) : 'Week of ' + calendarCursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</h3></div>
            <div className="calendar-toolbar-actions">
              <div className="segmented-control"><button type="button" className={calendarMode === 'month' ? 'active' : ''} onClick={() => setCalendarMode('month')}>Month</button><button type="button" className={calendarMode === 'week' ? 'active' : ''} onClick={() => setCalendarMode('week')}>Week</button></div>
              <button className="icon-button" type="button" onClick={() => setCalendarCursor(new Date())} aria-label="Jump to today">Today</button>
              <button className="icon-button" type="button" onClick={() => { const value = new Date(calendarCursor); value.setMonth(value.getMonth() - 1); setCalendarCursor(value) }} aria-label="Previous period">‹</button>
              <button className="icon-button" type="button" onClick={() => { const value = new Date(calendarCursor); value.setMonth(value.getMonth() + 1); setCalendarCursor(value) }} aria-label="Next period">›</button>
            </div>
          </div>
          <div className={'project-calendar ' + (calendarMode === 'week' ? 'project-calendar-week' : '')}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
            {calendarDates.map((date) => {
              const key = localDateKey(date)
              const dayTasks = dateGroups.get(key) || []
              const inMonth = date.getMonth() === calendarCursor.getMonth()
              return (
                <div className={'calendar-cell ' + (!inMonth ? 'calendar-cell-muted' : '')} key={key} onDoubleClick={() => onCreateTaskForDate?.(key)}>
                  <div className="calendar-cell-head"><span>{date.getDate()}</span><button type="button" aria-label={'Create task on ' + key} onClick={(event) => { event.stopPropagation(); onCreateTaskForDate?.(key) }}>＋</button></div>
                  <div className="calendar-task-list">
                    {dayTasks.slice(0, 3).map((task) => <button type="button" key={task.apiId} onClick={() => onSelectTask?.(task)} className="calendar-task-item"><span>{task.title}</span><Badge color={dueState(task) === 'danger' ? 'rose' : 'neutral'}>{task.priority}</Badge></button>)}
                    {dayTasks.length > 3 ? <span className="calendar-more">+{dayTasks.length - 3} more</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-dot legend-danger" /> At risk</span><span><i className="legend-dot legend-warning" /> Due soon</span><span>Double-click or ＋ to create</span></div>
        </div>
      ) : null}

      {view === 'timeline' ? (
        <div className="panel timeline-panel">
          <div className="workspace-section-head"><div><span className="eyebrow">Timeline</span><h3>Project delivery flow</h3><p>Important dated work shown against its expected due horizon.</p></div></div>
          {timelineRows.length ? (
            <div className="timeline-chart">
              {timelineRows.map(({ task, left, width }) => (
                <button type="button" className="timeline-row" key={task.apiId} onClick={() => onSelectTask?.(task)}>
                  <span className="timeline-label"><strong>{task.title}</strong><small>{task.assigneeName || 'Unassigned'} · {dueLabel(task)}</small></span>
                  <span className="timeline-track"><i style={{ left: left + '%', width: width + '%' }} /><em>{task.priority}</em></span>
                </button>
              ))}
            </div>
          ) : <div className="empty-state">Add due dates to see important work on the project timeline.</div>}
        </div>
      ) : null}

      {view === 'activity' ? (
        <div className="panel project-activity-panel">
          <div className="workspace-section-head"><div><span className="eyebrow">Activity</span><h3>Project history</h3><p>Member, task, dependency, assignment and comment events in chronological order.</p></div></div>
          {activity.length ? (
            <div className="project-activity-timeline">
              {activity.map((item) => (
                <div className="project-activity-item" key={item._id}>
                  <span className="activity-dot" />
                  <div><strong>{item.userId?.name || 'Team member'}</strong><p>{item.action.replaceAll('_', ' ').toLowerCase()}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No project activity has been recorded yet.</div>}
        </div>
      ) : null}
    </section>
  )
}
