import Icon from '../components/Icon'
import SectionHeader from '../components/SectionHeader'
import TaskTable from '../components/TaskTable'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import { pageCopy, tasks, workload } from '../data/teamflowMock'

export function GenericPage({ page, taskRows = tasks, onCreateTask }) {
  const copy = pageCopy[page] || pageCopy.Projects

  if (page === 'Team') {
    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        <div className="panel"><SectionHeader title="Team capacity" subtitle="Mock data from the TeamFlow planning model." /><div className="team-grid">
          {workload.map((member) => <div className="team-card" key={member.name}><Avatar initials={member.initials} color={member.tone} size="lg" /><div><h3>{member.name}</h3><p>Product team</p></div><Badge color={member.tone}>{member.status}</Badge><span className="team-stat">{member.tasks} active tasks</span></div>)}
        </div></div>
      </div>
    )
  }

  if (page === 'Reports') {
    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        <div className="reports-grid">
          <div className="panel report-big"><SectionHeader title="Project health" subtitle="Portfolio distribution by current status." /><div className="donut-wrap"><div className="donut"><span>68%</span></div><div><strong>Healthy</strong><p>5 of 8 projects are on track.</p><Badge color="green">+9% this month</Badge></div></div></div>
          <div className="panel report-big"><SectionHeader title="Delivery velocity" subtitle="Tasks completed per week." /><div className="mini-bars">{[38,52,47,67,60,78,83].map((v, i) => <span key={i} style={{ height: v + '%' }} />)}</div><div className="report-metric"><strong>24.6</strong><span>avg tasks / week</span></div></div>
        </div>
      </div>
    )
  }

  if (page === 'Settings') {
    return (
      <div className="page-stack">
        <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
        <div className="panel settings-panel">{['Workspace name','Default task priority','Notification preferences','Smart assignment','Theme preference'].map((label) => <div className="setting-row" key={label}><div><strong>{label}</strong><p>Configured for the Product Team workspace.</p></div><button className="toggle toggle-on"><span /></button></div>)}</div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-title-block"><span className="eyebrow">{copy[0]}</span><h1>{copy[1]}</h1><p>{copy[2]}</p></section>
      <div className="panel">
        <SectionHeader title={page === 'Projects' ? 'Your projects' : 'Your task queue'} subtitle="The visual foundation is ready for API integration." action="Create new" onAction={onCreateTask} />
        <TaskTable tasks={taskRows} />
      </div>
    </div>
  )
}
