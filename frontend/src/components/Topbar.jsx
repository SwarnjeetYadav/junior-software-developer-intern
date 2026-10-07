import Icon from './Icon'
import Avatar from './Avatar'
import { currentUser } from '../data/teamflowMock'

export default function Topbar({ page, onOpenMenu }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" type="button" onClick={onOpenMenu} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
        <div className="breadcrumb">
          <span>Product Team</span>
          <span className="breadcrumb-sep">/</span>
          <strong>{page}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input placeholder="Search tasks, projects..." aria-label="Search tasks and projects" />
          <kbd>⌘ K</kbd>
        </label>

        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Icon name="bell" size={18} />
          <span className="notification-dot" />
        </button>

        <button className="user-chip" type="button" aria-label={currentUser.name}>
          <Avatar initials={currentUser.initials} color="violet" size="sm" />
          <span className="user-chip-name">{currentUser.name}</span>
          <span className="chevron">⌄</span>
        </button>
      </div>
    </header>
  )
}
