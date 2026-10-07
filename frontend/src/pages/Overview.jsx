import Icon from '../components/Icon'
import StatCard from '../components/StatCard'
import SectionHeader from '../components/SectionHeader'
import ProjectCard from '../components/ProjectCard'
import TaskTable from '../components/TaskTable'
import ActivityFeed from '../components/ActivityFeed'
import WorkloadCard from '../components/WorkloadCard'
import { activity, projects, stats, tasks, workload } from '../data/teamflowMock'

export default function Overview({ onNavigate, onCreateTask, onSuggestAssignee }) {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">Wednesday · October 7, 2026</span>
          <h1>Good afternoon, Swarnjeet</h1>
          <p>Here is what is happening across your workspace today.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate('My Tasks')}><Icon name="check" size={16} /> Review my tasks</button>
            <button className="ghost-button" onClick={onCreateTask}><Icon name="plus" size={16} /> Create task</button>
          </div>
        </div>
        <div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-spark"><Icon name="spark" size={30} /></div></div>
      </section>

      <section className="stats-grid">{stats.map((item) => <StatCard key={item.label} item={item} />)}</section>

      <section>
        <SectionHeader title="Active projects" subtitle="A quick snapshot of the work your team is shipping." action="View all projects" onAction={() => onNavigate('Projects')} />
        <div className="project-grid">{projects.map((project) => <ProjectCard key={project.name} project={project} />)}</div>
      </section>

      <section className="content-grid content-grid-main">
        <div className="panel task-panel">
          <SectionHeader title="Priority tasks" subtitle="The work most likely to need your attention." action="Open task board" onAction={() => onNavigate('My Tasks')} />
          <TaskTable tasks={tasks} />
        </div>
        <WorkloadCard members={workload} onSuggest={onSuggestAssignee} />
      </section>

      <section className="content-grid content-grid-bottom">
        <div className="panel"><SectionHeader title="Recent activity" subtitle="A lightweight audit trail of important work." /><ActivityFeed items={activity} /></div>
        <div className="panel">
          <SectionHeader title="Completion trend" subtitle="Completed tasks over the last 7 days." />
          <div className="trend-chart">{[42,55,48,72,60,82,76].map((v, i) => <div className="trend-column" key={i}><div className="trend-bar" style={{ height: v + '%' }} /></div>)}</div>
          <div className="trend-footer"><strong>+18%</strong><span>vs previous week</span></div>
        </div>
      </section>
    </div>
  )
}
