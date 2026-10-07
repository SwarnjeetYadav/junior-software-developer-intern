import { useState } from 'react'
import Icon from './components/Icon'

const navItems = [
  ['Overview', 'grid'],
  ['Projects', 'folder'],
  ['My Tasks', 'check'],
  ['Team', 'users'],
  ['Reports', 'chart'],
  ['Settings', 'settings'],
]

const stats = [
  ['Active Projects', '08', '+2 this month', 'violet', 'folder'],
  ['Open Tasks', '42', '6 due this week', 'blue', 'check'],
  ['Completed', '128', '+18 this month', 'green', 'activity'],
  ['Overdue', '05', '2 need attention', 'rose', 'alert'],
]

const projects = [
  { name: 'TeamFlow Web App', meta: 'Product · 14 members', progress: 78, tone: 'violet', due: 'Oct 24', tasks: '18 / 23' },
  { name: 'Mobile Experience', meta: 'Product · 7 members', progress: 54, tone: 'blue', due: 'Nov 05', tasks: '11 / 20' },
  { name: 'Marketing Launch', meta: 'Growth · 6 members', progress: 82, tone: 'green', due: 'Oct 18', tasks: '22 / 27' },
]

const tasks = [
  ['TF-124', 'Implement task assignment API', 'TeamFlow Web App', 'AK', 'High', 'In Progress', 'Today'],
  ['TF-121', 'Review dashboard wireframes', 'TeamFlow Web App', 'PS', 'Medium', 'Review', 'Tomorrow'],
  ['MK-084', 'Prepare launch content matrix', 'Marketing Launch', 'RM', 'High', 'In Progress', 'Oct 12'],
  ['TF-118', 'Add notification preferences', 'TeamFlow Web App', 'NS', 'Low', 'Todo', 'Oct 15'],
  ['MB-031', 'Confirm mobile navigation states', 'Mobile Experience', 'VK', 'Medium', 'Todo', 'Oct 16'],
]

const activity = [
  ['AK', 'Ankit Kumar', 'moved TF-124 to In Progress', '12 min ago', 'violet'],
  ['PS', 'Priya Shah', 'commented on dashboard wireframes', '38 min ago', 'blue'],
  ['RM', 'Riya Mehta', 'completed MK-081', '1 hr ago', 'green'],
  ['NS', 'Neha Singh', 'was assigned TF-118', '2 hrs ago', 'amber'],
]

const workload = [
  ['AK', 'Ankit Kumar', 7, 'Balanced', 'green'],
  ['PS', 'Priya Shah', 5, 'Light', 'blue'],
  ['RM', 'Riya Mehta', 8, 'Busy', 'amber'],
  ['NS', 'Neha Singh', 4, 'Light', 'blue'],
]

const tone = function(name) {
  return 'tone-' + name
}

const Avatar = function({ initials, color = 'violet', size = 'sm' }) {
  return <span className={'avatar avatar-' + size + ' avatar-' + color}>{initials}</span>
}

const Badge = function({ children, color = 'neutral' }) {
  return <span className={'badge badge-' + color}>{children}</span>
}

const SectionHeader = function({ title, subtitle, action, onAction }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <button className="text-action" onClick={onAction}>{action} <span>→</span></button> : null}
    </div>
  )
}

function Sidebar({ page, onNavigate, open, onClose }) {
  return (
    <aside className={'sidebar ' + (open ? 'sidebar-open' : '')}>
      <div className="sidebar-top">
        <button className="brand" onClick={() => onNavigate('Overview')}>
          <span className="brand-mark">TF</span>
          <span><strong>TeamFlow</strong><small>Smart workspace</small></span>
        </button>
        <button className="icon-button sidebar-close" onClick={onClose}><Icon name="close" size={19} /></button>
      </div>

      <div className="workspace-switcher">
        <span className="workspace-logo">P</span>
        <span className="workspace-copy"><small>Workspace</small><strong>Product Team</strong></span>
        <span className="chevron">⌄</span>
      </div>

      <nav className="nav-groups">
        <div className="nav-label">Workspace</div>
        {navItems.slice(0, 5).map(function(item) {
          return (
            <button key={item[0]} className={'nav-item ' + (page === item[0] ? 'nav-item-active' : '')} onClick={() => { onNavigate(item[0]); onClose() }}>
              <span className="nav-icon"><Icon name={item[1]} size={17} /></span>
              <span>{item[0]}</span>
              {item[0] === 'My Tasks' ? <span className="nav-count">12</span> : null}
            </button>
          )
        })}
        <div className="nav-label nav-label-spaced">Manage</div>
        <button className={'nav-item ' + (page === 'Settings' ? 'nav-item-active' : '')} onClick={() => { onNavigate('Settings'); onClose() }}>
          <span className="nav-icon"><Icon name="settings" size={17} /></span><span>Settings</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="tip-icon"><Icon name="spark" size={16} /></div>
          <div><strong>Smart assignment</strong><span>Balance workloads automatically.</span></div>
        </div>
        <div className="profile-mini">
          <Avatar initials="SY" color="violet" size="lg" />
          <span><strong>Swarnjeet Yadav</strong><small>Project Manager</small></span>
          <Icon name="settings" size={16} />
        </div>
      </div>
    </aside>
  )
}

function Topbar({ page, onOpenMenu }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" onClick={onOpenMenu}><Icon name="menu" size={20} /></button>
        <div className="breadcrumb"><span>Product Team</span><span className="breadcrumb-sep">/</span><strong>{page}</strong></div>
      </div>
      <div className="topbar-actions">
        <div className="search-box"><Icon name="search" size={17} /><input placeholder="Search tasks, projects..." /><kbd>⌘ K</kbd></div>
        <button className="icon-button notification-button"><Icon name="bell" size={18} /><span className="notification-dot" /></button>
        <button className="user-chip"><Avatar initials="SY" color="violet" size="sm" /><span className="user-chip-name">Swarnjeet Yadav</span><span className="chevron">⌄</span></button>
      </div>
    </header>
  )
}

function StatCard({ item }) {
  return (
    <article className="stat-card">
      <div className={'stat-icon stat-icon-' + item[3]}><Icon name={item[4]} size={18} /></div>
      <div className="stat-head"><span>{item[0]}</span><span className="stat-ellipsis">•••</span></div>
      <strong className="stat-value">{item[1]}</strong>
      <div className={'stat-change ' + (item[2].startsWith('+') ? 'stat-change-positive' : 'stat-change-neutral')}>{item[2]}</div>
    </article>
  )
}

function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-card-top"><div className={'project-badge project-badge-' + project.tone}>{project.name.charAt(0)}</div><button className="more-button">•••</button></div>
      <div className="project-card-copy"><h3>{project.name}</h3><p>{project.meta}</p></div>
      <div className="project-progress-row"><span>Progress</span><strong>{project.progress}%</strong></div>
      <div className="progress-track"><span className={'progress-fill progress-' + project.tone} style={{ width: project.progress + '%' }} /></div>
      <div className="project-footer">
        <div className="avatar-stack"><Avatar initials="AK" color="violet" size="xs" /><Avatar initials="PS" color="blue" size="xs" /><Avatar initials="+5" color="neutral" size="xs" /></div>
        <div className="project-meta-right"><Badge color={project.progress > 75 ? 'green' : 'blue'}>{project.due}</Badge><span>{project.tasks} tasks</span></div>
      </div>
    </article>
  )
}

const priorityColor = { High: 'rose', Medium: 'amber', Low: 'blue' }
const statusColor = { 'In Progress': 'violet', Review: 'amber', Todo: 'neutral' }
const avatarColor = { AK: 'violet', PS: 'blue', RM: 'green', NS: 'amber', VK: 'rose' }

function TaskTable({ rows = tasks }) {
  return (
    <div className="table-wrap">
      <table className="task-table">
        <thead><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead>
        <tbody>
          {rows.map(function(task) {
            return (
              <tr key={task[0]}>
                <td><div className="task-title-cell"><span className="task-check" /><div><strong>{task[1]}</strong><span>{task[0]} · {task[2]}</span></div></div></td>
                <td><div className="assignee-cell"><Avatar initials={task[3]} color={avatarColor[task[3]]} size="sm" /><span>{task[3]}</span></div></td>
                <td><Badge color={priorityColor[task[4]]}>{task[4]}</Badge></td>
                <td><Badge color={statusColor[task[5]]}>{task[5]}</Badge></td>
                <td><span className={task[6] === 'Today' ? 'due-today' : ''}>{task[6]}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Overview({ setPage }) {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">Wednesday · October 7, 2026</span>
          <h1>Good afternoon, Swarnjeet</h1>
          <p>Here is what is happening across your workspace today.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setPage('My Tasks')}><Icon name="check" size={16} /> Review my tasks</button>
            <button className="ghost-button" onClick={() => setPage('Projects')}><Icon name="folder" size={16} /> Browse projects</button>
          </div>
        </div>
        <div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-spark"><Icon name="spark" size={30} /></div></div>
      </section>

      <section className="stats-grid">{stats.map(function(item) { return <StatCard key={item[0]} item={item} /> })}</section>

      <section>
        <SectionHeader title="Active projects" subtitle="A quick snapshot of the work your team is shipping." action="View all projects" onAction={() => setPage('Projects')} />
        <div className="project-grid">{projects.map(function(project) { return <ProjectCard key={project.name} project={project} /> })}</div>
      </section>

      <section className="content-grid content-grid-main">
        <div className="panel task-panel">
          <SectionHeader title="Priority tasks" subtitle="The work most likely to need your attention." action="Open task board" onAction={() => setPage('My Tasks')} />
          <TaskTable />
        </div>
        <aside className="workload-card">
          <div className="workload-top"><div><span className="eyebrow">Smart assignment</span><h3>Team workload</h3></div><span className="smart-chip"><Icon name="spark" size={13} /> Balanced</span></div>
          <p className="workload-subtitle">Use current active tasks to keep work evenly distributed.</p>
          <div className="workload-list">{workload.map(function(member) { return <div className="workload-row" key={member[1]}><Avatar initials={member[0]} color={member[4]} size="sm" /><div className="workload-person"><strong>{member[1]}</strong><span>{member[2]} active tasks</span></div><Badge color={member[4]}>{member[3]}</Badge></div> })}</div>
          <button className="smart-button"><Icon name="spark" size={16} /> Suggest assignee <span>→</span></button>
        </aside>
      </section>

      <section className="content-grid content-grid-bottom">
        <div className="panel">
          <SectionHeader title="Recent activity" subtitle="A lightweight audit trail of important work." />
          <div className="activity-list">{activity.map(function(item) { return <div className="activity-item" key={item[1] + item[3]}><Avatar initials={item[0]} color={item[4]} size="sm" /><div className="activity-copy"><p><strong>{item[1]}</strong> {item[2]}</p><span>{item[3]}</span></div></div> })}</div>
        </div>
        <div className="panel">
          <SectionHeader title="Completion trend" subtitle="Completed tasks over the last 7 days." />
          <div className="trend-chart">{[42,55,48,72,60,82,76].map(function(v, i) { return <div className="trend-column" key={i}><div className="trend-bar" style={{ height: v + '%' }} /></div> })}</div>
          <div className="trend-footer"><strong>+18%</strong><span>vs previous week</span></div>
        </div>
      </section>
    </div>
  )
}

function GenericPage({ page }) {
  const copy = {
    Projects: ['Portfolio','Projects','Keep every initiative visible, accountable, and moving forward.'],
    'My Tasks': ['Personal workspace','My Tasks','See your priorities, deadlines, and work in one focused queue.'],
    Team: ['People','Team','Understand ownership, workload, and availability at a glance.'],
    Reports: ['Insights','Reports','Turn project activity into concise, actionable visibility.'],
    Settings: ['Workspace','Settings','Configure workspace preferences and account controls.'],
  }[page]

  if (page === 'Team') {
    return <div className="page-stack"><section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section><div className="panel"><SectionHeader title="Team capacity" subtitle="Mock data from the TeamFlow planning model." /><div className="team-grid">{workload.map(function(m) { return <div className="team-card" key={m[1]}><Avatar initials={m[0]} color={m[4]} size="lg" /><div><h3>{m[1]}</h3><p>Product team</p></div><Badge color={m[4]}>{m[3]}</Badge><span className="team-stat">{m[2]} active tasks</span></div> })}</div></div></div>
  }

  if (page === 'Reports') {
    return <div className="page-stack"><section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section><div className="reports-grid"><div className="panel report-big"><SectionHeader title="Project health" subtitle="Portfolio distribution by current status." /><div className="donut-wrap"><div className="donut"><span>68%</span></div><div><strong>Healthy</strong><p>5 of 8 projects are on track.</p><Badge color="green">+9% this month</Badge></div></div></div><div className="panel report-big"><SectionHeader title="Delivery velocity" subtitle="Tasks completed per week." /><div className="mini-bars">{[38,52,47,67,60,78,83].map(function(v, i) { return <span key={i} style={{height: v + '%'}} /> })}</div><div className="report-metric"><strong>24.6</strong><span>avg tasks / week</span></div></div></div></div>
  }

  if (page === 'Settings') {
    const rows = ['Workspace name','Default task priority','Notification preferences','Smart assignment','Theme preference']
    return <div className="page-stack"><section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section><div className="panel settings-panel">{rows.map(function(label) { return <div className="setting-row" key={label}><div><strong>{label}</strong><p>Configured for the Product Team workspace.</p></div><button className="toggle toggle-on"><span /></button></div> })}</div></div>
  }

  return <div className="page-stack"><section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section><div className="panel"><SectionHeader title={page === 'Projects' ? 'Your projects' : 'Your task queue'} subtitle="This page will be connected to the TeamFlow API in the next implementation phase." action="Create new" /><TaskTable rows={page === 'Projects' ? tasks.slice(0,3) : tasks} /></div></div>
}

export default function App() {
  const [page, setPage] = useState('Overview')
  const [open, setOpen] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} open={open} onClose={() => setOpen(false)} />
      <div className="app-main">
        <Topbar page={page} onOpenMenu={() => setOpen(true)} />
        <main className="content">{page === 'Overview' ? <Overview setPage={setPage} /> : <GenericPage page={page} />}</main>
      </div>
      {open ? <button className="mobile-overlay" onClick={() => setOpen(false)} aria-label="Close navigation" /> : null}
    </div>
  )
}
