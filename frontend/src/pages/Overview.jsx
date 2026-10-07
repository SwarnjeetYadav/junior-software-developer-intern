import Icon from '../components/Icon'
import StatCard from '../components/StatCard'
import SectionHeader from '../components/SectionHeader'
import ProjectCard from '../components/ProjectCard'
import TaskTable from '../components/TaskTable'
import ActivityFeed from '../components/ActivityFeed'
import WorkloadCard from '../components/WorkloadCard'
import { activity, projects as mockProjects, stats as mockStats, tasks as mockTasks, workload } from '../data/teamflowMock'

function mapRemoteStats(summary) {
  if (!summary) return mockStats
  return [
    { label: 'Active Projects', value: String(summary.activeProjects).padStart(2, '0'), change: 'From live workspace', tone: 'violet', icon: 'folder' },
    { label: 'Open Tasks', value: String(summary.openTasks).padStart(2, '0'), change: 'From live workspace', tone: 'blue', icon: 'check' },
    { label: 'Completed', value: String(summary.completedTasks).padStart(2, '0'), change: 'From live workspace', tone: 'green', icon: 'activity' },
    { label: 'Overdue', value: String(summary.overdueTasks).padStart(2, '0'), change: 'Needs attention', tone: 'rose', icon: 'alert' },
  ]
}

export default function Overview({ onNavigate, onCreateTask, onSuggestAssignee, liveData }) {
  const remoteMode = liveData.connected
  const displayStats = remoteMode ? mapRemoteStats(liveData.summary) : mockStats
  const displayProjects = remoteMode ? liveData.projects.map((project, index) => ({
    name: project.name,
    meta: 'Live workspace · Project',
    progress: 0,
    tone: ['violet', 'blue', 'green'][index % 3],
    due: project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No due date',
    tasks: 'Live',
  })) : mockProjects
  const displayTasks = remoteMode && liveData.tasks.length ? liveData.tasks : mockTasks

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">{remoteMode ? 'Live workspace' : 'Demo workspace'} · Wednesday · October 7, 2026</span>
          <h1>Good afternoon, Swarnjeet</h1>
          <p>{remoteMode ? 'Your dashboard is connected to the TeamFlow API.' : 'Here is what is happening across your demo workspace today.'}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate('My Tasks')}><Icon name="check" size={16} /> Review my tasks</button>
            <button className="ghost-button" onClick={onCreateTask}><Icon name="plus" size={16} /> Create task</button>
          </div>
        </div>
        <div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-spark"><Icon name="spark" size={30} /></div></div>
      </section>

      {liveData.error ? <div className="api-banner"><span>API connection unavailable</span><small>{liveData.error}</small></div> : null}

      <section className="stats-grid">{displayStats.map((item) => <StatCard key={item.label} item={item} />)}</section>

      <section>
        <SectionHeader title="Active projects" subtitle="A quick snapshot of the work your team is shipping." action="View all projects" onAction={() => onNavigate('Projects')} />
        <div className="project-grid">{displayProjects.length ? displayProjects.map((project, index) => <ProjectCard key={project.name + index} project={project} />) : <div className="empty-state">No projects yet. Create your first workspace project from the API.</div>}</div>
      </section>

      <section className="content-grid content-grid-main">
        <div className="panel task-panel">
          <SectionHeader title="Priority tasks" subtitle="The work most likely to need your attention." action="Open task board" onAction={() => onNavigate('My Tasks')} />
          <TaskTable tasks={displayTasks} />
        </div>
        <WorkloadCard members={workload} onSuggest={onSuggestAssignee} />
      </section>

      <section className="content-grid content-grid-bottom">
        <div className="panel"><SectionHeader title="Recent activity" subtitle="A lightweight audit trail of important work." /><ActivityFeed items={activity} /></div>
        <div className="panel">
          <SectionHeader title="Completion trend" subtitle="Completed tasks over the last 7 days." />
          <div className="trend-chart">{[42,55,48,72,60,82,76].map((v, i) => <div className="trend-column" key={i}><div className="trend-bar" style={{ height: v + '%' }} /></div>)}</div>
          <div className="trend-footer"><strong>{remoteMode ? 'LIVE' : '+18%'}</strong><span>{remoteMode ? 'API connected' : 'vs previous week'}</span></div>
        </div>
      </section>
    </div>
  )
}
