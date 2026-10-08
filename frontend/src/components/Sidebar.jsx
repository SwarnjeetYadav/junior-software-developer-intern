import Icon from './Icon'
import Avatar from './Avatar'
import { currentUser, navItems } from '../data/teamflowMock'

function displayRole(role = '') {
  return role
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}


export default function Sidebar({ page, onNavigate, open, onClose, user, liveData }) {
  const displayUser = user || currentUser
  const openTaskCount = liveData?.connected
    ? liveData.tasks.filter((task) => task.assigneeId && String(task.assigneeId) === String(displayUser.id) && task.statusValue !== 'COMPLETED').length
    : 12

  return (
    <aside className={'sidebar ' + (open ? 'sidebar-open' : '')}>
      <div className="sidebar-top">
        <button className="brand" type="button" onClick={() => onNavigate('Overview')} aria-label="Go to overview">
          <span className="brand-mark">AN</span>
          <span><strong>Anvaya</strong><small>Smart workspace</small></span>
        </button>
        <button className="icon-button sidebar-close" type="button" onClick={onClose} aria-label="Close navigation">
          <Icon name="close" size={19} />
        </button>
      </div>

      <div className="workspace-switcher">
        <span className="workspace-logo">P</span>
        <span className="workspace-copy"><small>Workspace</small><strong>{liveData?.connected ? 'My Workspace' : 'Product Team'}</strong></span>
        <span className="chevron">⌄</span>
      </div>

      <nav className="nav-groups" aria-label="Primary navigation">
        <div className="nav-label">Workspace</div>
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.label}
            type="button"
            className={'nav-item ' + (page === item.label ? 'nav-item-active' : '')}
            onClick={() => { onNavigate(item.label); onClose() }}
          >
            <span className="nav-icon"><Icon name={item.icon} size={17} /></span>
            <span>{item.label}</span>
            {item.label === 'My Tasks' ? <span className="nav-count">{openTaskCount}</span> : null}
          </button>
        ))}

        <div className="nav-label nav-label-spaced">Manage</div>
        <button
          type="button"
          className={'nav-item ' + (page === 'Settings' ? 'nav-item-active' : '')}
          onClick={() => { onNavigate('Settings'); onClose() }}
        >
          <span className="nav-icon"><Icon name="settings" size={17} /></span>
          <span>Settings</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="tip-icon"><Icon name="spark" size={16} /></div>
          <div><strong>Smart assignment</strong><span>Balance workloads automatically.</span></div>
        </div>

        <div className="profile-mini">
          <Avatar initials={displayUser.initials || displayUser.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AN'} color="violet" size="lg" />
          <span><strong>{displayUser.name || currentUser.name}</strong><small>{displayRole(displayUser.role || currentUser.role)}</small></span>
          <Icon name="settings" size={16} />
        </div>
      </div>
    </aside>
  )
}
