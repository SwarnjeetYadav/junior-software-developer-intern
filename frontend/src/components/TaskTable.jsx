import Avatar from './Avatar'
import Badge from './Badge'

const priorityColor = { High: 'rose', Medium: 'amber', Low: 'blue' }
const statusColor = { 'In Progress': 'violet', Review: 'amber', Todo: 'neutral' }
const avatarColor = { AK: 'violet', PS: 'blue', RM: 'green', NS: 'amber', VK: 'rose' }

export default function TaskTable({ tasks = [] }) {
  return (
    <div className="table-wrap">
      <table className="task-table">
        <thead>
          <tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <div className="task-title-cell">
                  <span className="task-check" />
                  <div><strong>{task.title}</strong><span>{task.id} · {task.project}</span></div>
                </div>
              </td>
              <td>
                <div className="assignee-cell">
                  <Avatar initials={task.assignee} color={avatarColor[task.assignee] || 'neutral'} size="sm" />
                  <span>{task.assigneeName}</span>
                </div>
              </td>
              <td><Badge color={priorityColor[task.priority] || 'neutral'}>{task.priority}</Badge></td>
              <td><Badge color={statusColor[task.status] || 'neutral'}>{task.status}</Badge></td>
              <td><span className={task.due === 'Today' ? 'due-today' : ''}>{task.due}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
