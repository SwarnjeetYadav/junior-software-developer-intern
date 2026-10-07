import Icon from './Icon'
import Avatar from './Avatar'
import { useState } from 'react'
import { currentUser } from '../data/teamflowMock'

export default function Topbar({ page, onOpenMenu, onLogout, demoMode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = demoMode ? currentUser : JSON.parse(localStorage.getItem('teamflow_user') || 'null') || currentUser

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" type="button" onClick={onOpenMenu} aria-label="Open navigation"><Icon name="menu" size={20} /></button>
        <div className="breadcrumb"><span>Product Team</span><span className="breadcrumb-sep">/</span><strong>{page}</strong></div>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input placeholder="Search tasks, projects..." aria-label="Search tasks and projects" />
          <kbd>⌘ K</kbd>
        </label>

        <button className="icon-button notification-button" type="button" aria-label="Notifications"><Icon name="bell" size={18} /><span className="notification-dot" /></button>

        <div className="profile-menu">
          <button className="user-chip" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
            <Avatar initials={user.initials || 'SY'} color="violet" size="sm" />
            <span className="user-chip-name">{user.name}</span>
            <span className="chevron">⌄</span>
          </button>
          {menuOpen ? <div className="profile-dropdown"><strong>{user.role || 'Project Manager'}</strong>{demoMode ? <span>Demo workspace</span> : <span>Connected to API</span>}<button type="button" onClick={onLogout}>Sign out</button></div> : null}
        </div>
      </div>
    </header>
  )
}
