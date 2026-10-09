# Junior Software Developer Internship

## Project

**Anvaya - Smart Task Management and Collaboration Platform**

This repository records the weekly internship documentation and the actual Anvaya project build.

## Internship

- Organization: YuvaIntern
- Role: Junior Software Developer Intern
- Mode: Remote
- Duration: 6 weeks
- Start Date: 29 September 2026
- End Date: 10 November 2026

## Project Status

**Six-week documentation completed; advanced workspace implementation, testing, deployment configuration and production hardening are in place.**

## Deployment Architecture

```text
Browser
   |
   v
Vercel / React Frontend
   |
   | HTTPS REST API
   v
Render / Node + Express Backend
   |
   v
MongoDB Atlas
```

### Frontend deployment

Use the `frontend` directory as the Vercel project root.

Build command: `npm run build`

Output directory: `dist`

Set:
`VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`

Current frontend deployment:
`https://anvaya-git-main-swarnjeets-projects.vercel.app/`

`frontend/vercel.json` provides the SPA fallback for client-side routes such as `/projects`, `/team`, `/reports` and `/settings`.

### Backend deployment

The repository includes `render.yaml` for a Render web service.

Required production environment variables:

- `NODE_ENV=production`
- `MONGODB_URI=<MongoDB Atlas connection string>`
- `JWT_SECRET=<random secret of at least 32 characters>`
- `CLIENT_ORIGINS=https://anvaya-git-main-swarnjeets-projects.vercel.app`

Never commit real credentials.

## Production Hardening

The backend now includes:

- Helmet security headers.
- Explicit CORS origin allow-listing.
- Authentication rate limiting.
- JSON request size limiting.
- Disabled Express `X-Powered-By`.
- Production proxy awareness.
- Strong JWT secret validation in production.
- Structured HTTP request timing logs.
- Graceful SIGTERM/SIGINT shutdown.
- Health endpoint with timestamp and process uptime.
- Centralized safe error responses.

## Testing

GitHub Actions validates backend unit tests, backend API integration tests, frontend production build, and Chromium browser regression tests.

## Weekly Progress

| Week | Focus | Status |
|---|---|---|
| Week 1 | Project Planning and Requirements Analysis | Completed |
| Week 2 | Design Documentation and Architecture Planning | Completed |
| Week 3 | Feature Development and Code Prototype Documentation | Completed |
| Week 4 | Software Testing and QA Planning | Completed |
| Week 5 | Code Debugging Refactoring and Technical Analysis | Completed |
| Week 6 | Final Project Integration Reflection and Future Roadmap | Completed |

## Application Build

### Frontend

- Responsive Anvaya workspace
- Live authenticated workspace loading
- Live project listing and creation
- Project-aware live task creation
- Live task filtering
- Live task updates
- Live task comments
- Live project progress and member counts
- Live team workload aggregation
- Live project team management, member roles, removal, invitations, and project chat
- Live project member search and add flow
- Notifications with user preferences
- Activity feed
- Demo mode
- Playwright regression suite

### Backend

- JWT authentication
- Role based access
- Projects and membership
- Tasks and explainable Smart Assignment 2.0
- Kanban board, list, calendar and timeline views
- Task dependencies with cycle prevention and blocker notifications
- Project analytics and Anvaya Insights
- Permission-aware global search / Ctrl+K command palette
- Project invitations and onboarding
- Activity logging
- Notifications
- Dashboard summary
- Centralized errors
- Vitest unit tests
- Disposable MongoDB integration tests
- Production security middleware

## Current User Journey

Login -> Workspace -> Projects -> Create Project -> Create Task -> Smart Assignment -> Task Details -> Status/Priority/Assignee/Due Update -> Comment -> Activity -> Notification -> Team Member Management

See `DEVELOPMENT-LOG.md` for the implementation history.


## Advanced Workspace

The current Anvaya workspace follows the advanced product specification:

- **Project views:** Overview, Board, List, Calendar, Timeline, Activity.
- **Smart Assignment 2.0:** top-three explainable recommendations based on workload, due-date fit, project role, priority load and availability.
- **Dependencies:** predecessor/successor links, circular-chain prevention, blocker enforcement and dependency-unblocked notifications.
- **Collaboration:** floating project chat with unread state, fullscreen mode, replies, mentions, reactions and task context support.
- **Team administration:** project-scoped Project Manager, Team Member and Viewer permissions, member add/remove/role changes and seven-day invitations.
- **Intelligence:** live completion, overdue, blocked, cycle-time, throughput and workload analytics plus rule-based project health signals.
- **Search:** permission-aware global search with Ctrl/Cmd+K command palette.
- **Settings:** notification preferences and workspace display density.
- **Quality:** unit/integration coverage and Playwright regression coverage for the advanced workspace.

The advanced implementation intentionally keeps secondary features inside project/work surfaces so the global navigation remains focused.
