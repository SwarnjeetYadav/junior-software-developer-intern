import Avatar from './Avatar'
import Badge from './Badge'

export default function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-card-top">
        <div className={'project-badge project-badge-' + project.tone}>{project.name.charAt(0)}</div>
        <button className="more-button" type="button" aria-label={'More options for ' + project.name}>•••</button>
      </div>

      <div className="project-card-copy">
        <h3>{project.name}</h3>
        <p>{project.meta}</p>
      </div>

      <div className="project-progress-row">
        <span>Progress</span>
        <strong>{project.progress}%</strong>
      </div>
      <div className="progress-track">
        <span className={'progress-fill progress-' + project.tone} style={{ width: project.progress + '%' }} />
      </div>

      <div className="project-footer">
        <div className="avatar-stack" aria-label="Project members">
          <Avatar initials="AK" color="violet" size="xs" />
          <Avatar initials="PS" color="blue" size="xs" />
          <Avatar initials="+5" color="neutral" size="xs" />
        </div>
        <div className="project-meta-right">
          <Badge color={project.progress > 75 ? 'green' : 'blue'}>{project.due}</Badge>
          <span>{project.tasks} tasks</span>
        </div>
      </div>
    </article>
  )
}
