import { useEffect, useMemo, useState } from 'react'
import Badge from './Badge'
import Icon from './Icon'
import { api } from '../lib/api'

export default function ReportsWorkspace({ projects = [], tasks = [], onSelectTask }) {
  const [projectId, setProjectId] = useState(projects[0]?._id || '')
  const [analytics, setAnalytics] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!projectId && projects[0]?._id) setProjectId(projects[0]._id)
    if (projectId && !projects.some((project) => project._id === projectId)) setProjectId(projects[0]?._id || '')
  }, [projects, projectId])

  useEffect(() => {
    if (!projectId) {
      setAnalytics(null)
      setInsights([])
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([api.listProjectAnalytics(projectId), api.listProjectInsights(projectId)])
      .then(([analyticsResult, insightsResult]) => {
        if (cancelled) return
        setAnalytics(analyticsResult.data || null)
        setInsights(insightsResult.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [projectId])

  const selectedProject = projects.find((project) => project._id === projectId)
  const projectTasks = tasks.filter((task) => String(task.projectId) === String(projectId))
  const maxThroughput = Math.max(...(analytics?.throughput || []).map((item) => item.completed), 1)
  const completionRate = analytics?.completionRate || 0
  const riskCount = analytics ? analytics.overdueTasks + analytics.blockedTasks : 0

  const projectTaskMap = useMemo(() => new Map(projectTasks.map((task) => [String(task.apiId), task])), [projectTasks])

  return (
    <section className="reports-workspace">
      <div className="reports-workspace-toolbar">
        <div><span className="eyebrow">Execution intelligence</span><h2>Project analytics</h2><p>Measure delivery health using the same live task data that powers the project workspace.</p></div>
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Select analytics project">
          {projects.map((project) => <option value={project._id} key={project._id}>{project.name}</option>)}
        </select>
      </div>

      {loading ? <div className="workspace-inline-status">Refreshing analytics...</div> : null}
      {error ? <div className="workspace-error-banner">{error}</div> : null}

      {selectedProject ? (
        <>
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi"><span>Completion rate</span><strong>{completionRate}%</strong><small>{analytics?.completedTasks || 0} of {analytics?.totalTasks || 0} tasks complete</small></div>
            <div className="analytics-kpi"><span>Overdue</span><strong>{analytics?.overdueTasks || 0}</strong><small>{analytics?.overdueRate || 0}% of tracked work</small></div>
            <div className="analytics-kpi"><span>Blocked</span><strong>{analytics?.blockedTasks || 0}</strong><small>{analytics?.dependencyCount || 0} dependency links</small></div>
            <div className="analytics-kpi"><span>Median cycle</span><strong>{analytics?.medianCycleTimeHours || 0}h</strong><small>from start to completion</small></div>
          </div>

          <div className="reports-advanced-grid">
            <section className="panel">
              <div className="workspace-section-head"><div><span className="eyebrow">Throughput</span><h3>Completed work over 8 weeks</h3><p>Weekly completion counts help identify delivery rhythm.</p></div></div>
              <div className="throughput-chart">
                {(analytics?.throughput || []).map((item) => (
                  <div className="throughput-column" key={item.week}>
                    <strong>{item.completed}</strong>
                    <span><i style={{ height: Math.max(8, (item.completed / maxThroughput) * 100) + '%' }} /></span>
                    <small>{new Date(item.week).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="workspace-section-head"><div><span className="eyebrow">Workload</span><h3>Active task distribution</h3><p>Use the spread as a prompt for redistribution.</p></div><Badge color={analytics?.workloadSpread >= 3 ? 'amber' : 'green'}>{analytics?.workloadSpread || 0} spread</Badge></div>
              <div className="analytics-workload-list">
                {(analytics?.workload || []).map((item) => {
                  const taskCount = item.activeTasks || 0
                  const max = Math.max(...(analytics?.workload || []).map((candidate) => candidate.activeTasks), 1)
                  const member = projectTasks.find((task) => String(task.assigneeId) === String(item.userId))
                  return <div key={item.userId}><div><strong>{member?.assigneeName || 'Team member'}</strong><span>{taskCount} active tasks</span></div><div className="analytics-workload-track"><i style={{ width: Math.round((taskCount / max) * 100) + '%' }} /></div></div>
                })}
                {!analytics?.workload?.length ? <div className="detail-empty">No assigned active tasks yet.</div> : null}
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="workspace-section-head"><div><span className="eyebrow">Anvaya Insights</span><h3>Signals that need attention</h3><p>Each signal explains why it appeared and what to do next.</p></div><Badge color={riskCount ? 'amber' : 'green'}>{riskCount ? riskCount + ' risk signals' : 'Healthy'}</Badge></div>
            <div className="reports-insights-grid">
              {insights.map((insight) => (
                <button className="report-insight-card" type="button" key={insight.type} onClick={() => {
                  const task = insight.entityIds?.map((id) => projectTaskMap.get(String(id))).find(Boolean)
                  if (task) onSelectTask?.(task)
                }}>
                  <div><Badge color={insight.severity === 'HIGH' ? 'rose' : insight.severity === 'MEDIUM' ? 'amber' : 'green'}>{insight.severity}</Badge><Icon name="chevron" size={15} /></div>
                  <strong>{insight.signal}</strong>
                  <p>{insight.reason}</p>
                  <span>{insight.action}</span>
                </button>
              ))}
              {!insights.length ? <div className="empty-state">No actionable signals for this project right now.</div> : null}
            </div>
          </section>
        </>
      ) : (
        <div className="panel"><div className="empty-state">Create a project to unlock live analytics.</div></div>
      )}
    </section>
  )
}
