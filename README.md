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

**Six-week documentation completed; application implementation, testing, deployment configuration and production hardening are in progress.**

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

`frontend/vercel.json` provides the SPA fallback for client-side routes such as `/projects`, `/team`, `/reports` and `/settings`.

### Backend deployment

The repository includes `render.yaml` for a Render web service.

Required production environment variables:

- `NODE_ENV=production`
- `MONGODB_URI=<MongoDB Atlas connection string>`
- `JWT_SECRET=<random secret of at least 32 characters>`
- `CLIENT_ORIGINS=https://<your-vercel-domain>`

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
- Live project member search and add flow
- Notifications
- Activity feed
- Demo mode
- Playwright regression suite

### Backend

- JWT authentication
- Role based access
- Projects and membership
- Tasks and smart assignment
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
