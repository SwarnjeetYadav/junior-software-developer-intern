import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import TaskTable from '../components/TaskTable'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import ProjectCard from '../components/ProjectCard'
import { api } from '../lib/api'
import { pageCopy, projects as mockProjects, tasks, workload } from '../data/teamflowMock'

const statusOptions = [
  ['', 'All statuses'],
  ['TODO', 'Todo'],
  ['IN_PROGRESS', 'In Progress'],
  ['REVIEW', 'Review'],
  ['BLOCKED', 'Blocked'],
  ['COMPLETED', 'Completed'],
]
const priorityOptions = [
  ['', 'All priorities'],
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['CRITICAL', 'Critical'],
]

function projectCard(project, liveData) {
  const members = liveData.membersByProject?.[project._id] || []
  return {
    ...project,
    meta: (project.status || 'ACTIVE').replaceAll('_', ' ') + ' · ' + (project.memberCount || 0) + ' members',
    progress: project.progress || 0,
    due: project.dueDate
      ? new Date(project.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : 'No due date',
    tasks: (project.completedTaskCount || 0) + ' / ' + (project.taskCount || 0) + ' tasks',
    members,
  }
}

function filterRows(rows, search, status, priority) {
  const normalized = search.trim().toLowerCase()
  return rows.filter((task) => {
    const matchesSearch = !normalized
      || task.title.toLowerCase().includes(normalized)
      || task.project.toLowerCase().includes(normalized)
      || (task.assigneeName || '').toLowerCase().includes(normalized)
    const matchesStatus = !status || task.statusValue === status
    const matchesPriority = !priority || task.priorityValue === priority
    return matchesSearch && matchesStatus && matchesPriority
  })
}

function TaskFilters({ search, setSearch, status, setStatus, priority, setPriority }) {
  return (
    <div className="task-filters">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter tasks..." aria-label="Filter tasks" />
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter task status">
        {statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
      <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter task priority">
        {priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
    </div>
  )
}

function MemberManager({ projects, membersByProject, onChanged }) {
  const [projectId, setProjectId] = useState(projects[0]?._id || '')
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!projectId && projects[0]?._id) setProjectId(projects[0]._id)
    if (projectId && !projects.some((project) => project._id === projectId)) setProjectId(projects[0]?._id || '')
  }, [projects, projectId])

  useEffect(() => {
    setCandidates([])
    setMessage('')
    setError('')

    const term = query.trim()
    if (term.length < 2 || !projectId) return undefined

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
  }, [query, projectId])

  const currentMembers = membersByProject?.[projectId] || []

  const add = async (member) => {
    setAddingId(member._id)
    setError('')
    setMessage('')
    try {
      await api.addMember(projectId, member._id)
      setMessage(member.name + ' added to the project.')
      setCandidates((current) => current.filter((item) => item._id !== member._id))
      setQuery('')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingId('')
    }
  }

  return (
    <div className="member-manager">
      <div className="member-manager-head">
        <div><span className="eyebrow">Live membership</span><h2>Manage project members</h2><p>Add active TeamFlow users to the selected project.</p></div>
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Project for member management">
          {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
        </select>
      </div>

      <div className="member-manager-columns">
        <div className="member-list-box">
          <div className="member-box-head"><strong>Current members</strong><span>{currentMembers.length}</span></div>
          {currentMembers.length ? currentMembers.map((member) => (
            <div className="member-row" key={member.id}>
              <Avatar initials={member.initials} color={member.tone} size="sm" />
              <div><strong>{member.name}</strong><small>{member.email} · {member.role?.replaceAll('_', ' ')}</small></div>
              <Badge color="green">Active</Badge>
            </div>
          )) : <div className="comment-empty">No members loaded for this project.</div>}
        </div>

        <div className="member-list-box">
          <div className="member-box-head"><strong>Add a member</strong><span>Search by name or email</span></div>
          <input className="member-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Priya or priya@example.com" />
          {searching ? <div className="comment-empty">Searching users...</div> : null}
          {!searching && query.trim().length >= 2 && !candidates.length ? <div className="comment-empty">No active users available.</div> : null}
          <div className="member-candidate-list">
            {candidates.map((member) => (
              <div className="member-row" key={member._id}>
                <Avatar initials={member.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()} color="violet" size="sm" />
                <div><strong>{member.name}</strong><small>{member.email} · {member.role?.replaceAll('_', ' ')}</small></div>
                <button className="small-action-button" type="button" onClick={() => add(member)} disabled={addingId === member._id}>{addingId === member._id ? 'Adding...' : 'Add'}</button>
              </div>
            ))}
          </div>
          {message ? <div className="success-banner">{message}</div> : null}
          {error ? <div className="login-error">{error}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function GenericPage({
  page,
  taskRows = tasks,
  onCreateTask,
  onCreateProject,
  onSelectTask,
  liveData,
  currentUserId,
  currentUser,
  onMembersChanged,
  canManageProjects = false,
}) {
  const copy = pageCopy[page] || pageCopy.Projects
  const remoteProjects = liveData.connected ? liveData.projects : []
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  useEffect(() => {
    if (!selectedProjectId && remoteProjects[0]?._id) setSelectedProjectId(remoteProjects[0]._id)
    if (selectedProjectId && !remoteProjects.some((project) => project._id === selectedProjectId)) setSelectedProjectId(remoteProjects[0]?._id || '')
  }, [remoteProjects, selectedProjectId])

  const allRows = liveData.connected ? liveData.tasks : taskRows
  const myRows = page === 'My Tasks' && liveData.connected
    ? allRows.filter((task) => task.assigneeId && String(task.assigneeId) === String(currentUserId))
    : allRows

  const projectRows = selectedProjectId
    ? myRows.filter((task) => String(task.projectId) === String(selectedProjectId))
    : myRows
  const rows = filterRows(page === 'Projects' && selectedProjectId ? projectRows : myRows, search, status, priority)

  if (page === 'Projects') {
    const projectsToShow = liveData.connected
      ? remoteProjects.map((project) => projectCard(project, liveData))
      : mockProjects

    return (
      <div className="page-stack">
        <section className="page-title-block page-title-inline">
          <div><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></div>
          {canManageProjects ? <button className="primary-button primary-button-dark" type="button" onClick={onCreateProject}>＋ New project</button> : null}
        </section>

        {liveData.connected ? (
          <>
            <div className="project-toolbar">
              <span>{remoteProjects.length} project{remoteProjects.length === 1 ? '' : 's'} available to your account</span>
              {liveData.loading ? <small>Refreshing workspace...</small> : null}
            </div>
            <div className="project-grid">
              {projectsToShow.length
                ? projectsToShow.map((project) => <ProjectCard key={project._id} project={project} onOpen={(item) => setSelectedProjectId(item._id)} />)
                : <div className="empty-state">No projects yet. A Project Manager can create a project and add you to it.</div>}
            </div>

            {remoteProjects.length ? (
              <div className="panel">
                <div className="project-queue-head">
                  <SectionHeader title="Project work queue" subtitle="Live tasks for the selected project." action="Create new" onAction={onCreateTask} />
                  <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} aria-label="Select project task queue">
                    {remoteProjects.map((project) => <option value={project._id} key={project._id}>{project.name}</option>)}
                  </select>
                </div>
                <TaskFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} priority={priority} setPriority={setPriority} />
                <TaskTable tasks={rows} onSelectTask={onSelectTask} />
              </div>
            ) : (
              <div className="panel">
                <SectionHeader title="Project work queue" subtitle="There is no project to show yet." />
                <div className="empty-state">Create a project first, then its tasks will appear here.</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="project-grid">{projectsToShow.map((project, index) => <ProjectCard key={project.name + index} project={project} />)}</div>
            <div className="panel"><SectionHeader title="Project work queue" subtitle="Demo task data for the UI review." action="Create new" onAction={onCreateTask} /><TaskTable tasks={taskRows} onSelectTask={onSelectTask} /></div>
          </>
        )}
      </div>
    )
  }

  if (page === 'Team') {
    const people = liveData.connected ? liveData.members : workload

    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        {liveData.connected && canManageProjects && remoteProjects.length ? (
          <MemberManager projects={remoteProjects} membersByProject={liveData.membersByProject} onChanged={onMembersChanged} />
        ) : null}
        <div className="panel">
          <SectionHeader title="Team capacity" subtitle={liveData.connected ? 'Live members aggregated across your projects.' : 'Mock data from the TeamFlow planning model.'} />
          {liveData.connected && !remoteProjects.length ? (
            <div className="empty-state">No team members are visible because you are not assigned to any project yet.</div>
          ) : people.length ? (
            <div className="team-grid">
              {people.map((member) => (
                <div className="team-card" key={member.id || member.name}>
                  <Avatar initials={member.initials} color={member.tone} size="lg" />
                  <div><h3>{member.name}</h3><p>{member.email}</p></div>
                  <Badge color={member.activeTasks <= 5 ? 'blue' : member.activeTasks <= 7 ? 'green' : 'amber'}>{member.activeTasks <= 5 ? 'Light' : member.activeTasks <= 7 ? 'Balanced' : 'Busy'}</Badge>
                  <span className="team-stat">{member.activeTasks || 0} active tasks · {member.projectIds?.length || 0} project{(member.projectIds?.length || 0) === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No team members have been added yet.</div>}
        </div>
      </div>
    )
  }

  if (page === 'Reports') {
    if (!liveData.connected) {
      return (
        <div className="page-stack">
          <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
          <div className="reports-grid">
            <div className="panel report-big"><SectionHeader title="Project health" subtitle="Portfolio distribution for the demo workspace." /><div className="donut-wrap"><div className="donut" style={{ background: 'conic-gradient(#6f5cf5 0 68%, #ececf5 68%)' }}><span>68%</span></div><div><strong>Healthy</strong><p>Demo portfolio data.</p><Badge color="green">+9% this month</Badge></div></div></div>
            <div className="panel report-big"><SectionHeader title="Delivery velocity" subtitle="Demo completed tasks per week." /><div className="mini-bars">{[38,52,47,67,60,78,83].map((v, i) => <span key={i} style={{ height: v + '%' }} />)}</div><div className="report-metric"><strong>24.6</strong><span>avg tasks / week</span></div></div>
          </div>
        </div>
      )
    }

    const summary = liveData.summary || { activeProjects: 0, openTasks: 0, completedTasks: 0, overdueTasks: 0 }
    const totalTasks = summary.openTasks + summary.completedTasks
    const completion = totalTasks ? Math.round((summary.completedTasks / totalTasks) * 100) : 0
    const statusValues = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED']
    const statusCounts = statusValues.map((value) => liveData.tasks.filter((task) => task.statusValue === value).length)
    const maxStatusCount = Math.max(...statusCounts, 1)

    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        <div className="reports-grid">
          <div className="panel report-big">
            <SectionHeader title="Project health" subtitle="Completion based on tasks visible to your account." />
            <div className="donut-wrap">
              <div className="donut" style={{ background: 'conic-gradient(#6f5cf5 0 ' + completion + '%, #ececf5 ' + completion + '%)' }}><span>{completion}%</span></div>
              <div><strong>Live progress</strong><p>{summary.activeProjects} active project{summary.activeProjects === 1 ? '' : 's'} · {totalTasks} tracked task{totalTasks === 1 ? '' : 's'}</p><Badge color={summary.completedTasks ? 'green' : 'neutral'}>{summary.completedTasks} complete</Badge></div>
            </div>
          </div>
          <div className="panel report-big">
            <SectionHeader title="Task status mix" subtitle="Current task counts by workflow status." />
            {totalTasks ? (
              <>
                <div className="mini-bars">{statusCounts.map((value, index) => <span key={statusValues[index]} style={{ height: Math.max(12, (value / maxStatusCount) * 100) + '%' }} />)}</div>
                <div className="report-metric"><strong>{totalTasks}</strong><span>tracked tasks</span></div>
              </>
            ) : <div className="empty-state">No tasks available yet.</div>}
          </div>
        </div>
      </div>
    )
  }

  if (page === 'Settings') {
    if (!liveData.connected) {
      return (
        <div className="page-stack">
          <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
          <div className="panel settings-panel">
            <div className="setting-row"><div><strong>Demo mode</strong><p>These values belong only to the local demo workspace.</p></div><span className="setting-value">Preview</span></div>
            <div className="setting-row"><div><strong>Sample projects</strong><p>Demo records are displayed only while Preview Demo is active.</p></div><span className="setting-value">Enabled</span></div>
          </div>
        </div>
      )
    }

    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        <div className="panel settings-panel">
          <div className="setting-row"><div><strong>Account name</strong><p>{currentUser?.name || '—'}</p></div><span className="setting-value">{currentUser?.role?.replaceAll('_', ' ') || '—'}</span></div>
          <div className="setting-row"><div><strong>Email</strong><p>{currentUser?.email || '—'}</p></div><span className="setting-value">Signed-in account</span></div>
          <div className="setting-row"><div><strong>Visible projects</strong><p>Projects currently available to your account.</p></div><span className="setting-value">{remoteProjects.length}</span></div>
          <div className="setting-row"><div><strong>Visible tasks</strong><p>Tasks currently available to your account.</p></div><span className="setting-value">{allRows.length}</span></div>
          <div className="setting-row"><div><strong>Workspace connection</strong><p>Frontend data is loaded from the TeamFlow API.</p></div><span className="setting-value">Connected</span></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-title-block page-title-inline">
        <div><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></div>
        <button className="primary-button primary-button-dark" type="button" onClick={onCreateTask}>＋ Create task</button>
      </section>
      {liveData.connected ? <TaskFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} priority={priority} setPriority={setPriority} /> : null}
      <div className="panel">
        <SectionHeader
          title={page === 'My Tasks' ? 'Your task queue' : 'Task queue'}
          subtitle={liveData.connected ? rows.length + ' matching task' + (rows.length === 1 ? '' : 's') + ' from the TeamFlow API.' : 'Demo task data for the UI review.'}
        />
        <TaskTable tasks={rows} onSelectTask={onSelectTask} />
      </div>
    </div>
  )
}
