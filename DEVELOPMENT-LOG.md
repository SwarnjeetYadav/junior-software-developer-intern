# TeamFlow Development Log

This file records the actual application build after the six internship simulation documents.

## Foundation

### Phase 1 Frontend
- Responsive TeamFlow workspace shell
- Reusable Sidebar, Topbar, Avatar, Badge, SectionHeader and card components
- Overview dashboard
- Project, task, team, reports and settings views
- Task creation modal
- Workload aware smart assignment preview
- Local demo workspace mode
- Authentication screen
- Frontend API client
- Live dashboard and project/task loading when the API is available

### Phase 2 Backend
- Express API foundation
- MongoDB connection
- JWT authentication
- User registration and login
- Role based authorization
- Project creation and listing
- Project scoped membership checks
- Project member management
- Task creation and listing
- Task update flow
- Workload aware smart assignment
- Activity logging
- Assignment notifications
- Dashboard summary
- Centralized error handling
- Controlled local demo seed script

### Phase 3 Testing and Refactoring
- Centralized task status and priority validation rules
- Isolated smart assignment service
- Unit tests for task rules
- Unit tests for least loaded assignment behaviour
- Vitest test configuration
- GitHub Actions CI workflow for backend tests and frontend build

### Phase 4: API Integration Testing

#### Completed
- Added a disposable MongoDB integration environment using mongodb-memory-server.
- Added HTTP level API assertions using SuperTest.
- Covered the end to end TeamFlow workflow from authentication through project creation member addition smart assignment comments notifications activity and persistence verification.
- Added a negative authorization scenario for non-member project access.
- Added a dedicated npm script for the integration suite.

#### Evidence Path
```text
API request
   -> Express route
   -> Authentication / Authorization
   -> Service layer
   -> MongoDB test database
   -> Response
   -> Persistence assertions
```

### Phase 5: Live Frontend Management

#### Completed
- Reworked frontend data loading to retrieve members and tasks for every accessible project.
- Added live project progress, completed-task totals and member counts.
- Added project-aware task creation with selectable project and project-specific assignee lists.
- Added live task filters for status, priority and text search.
- Added a live My Tasks queue scoped to the authenticated user.
- Added live task editing for status, priority, assignee and due date.
- Added live project member candidate search by name or email.
- Added controlled member-add flow with duplicate membership protection.
- Updated the Team view to aggregate workload across live projects.
- Removed fixed demo project/member avatars from the live project cards.
- Added live user identity and task counts to the navigation shell.

### Phase 6: Browser Regression Testing

#### Completed
- Added Playwright Test browser tooling.
- Added Chromium browser regression coverage for demo navigation and task creation.
- Added live API-backed UI regression coverage using deterministic API interception.
- Covered live project progress rendering and task filtering.
- Covered live task details updates for status and priority.
- Covered live project member search and add flow.
- Updated CI to install Chromium and run the browser suite.

## Current Architecture

Frontend
React and Vite

Backend
Node.js and Express

Database
MongoDB

API
REST with JSON

Authentication
JWT Bearer tokens

Testing
Vitest unit and integration tests
Playwright browser regression tests

Source Control
Git and GitHub

## Current User Journey

Login -> Workspace -> Projects -> Create Project -> Create Task -> Smart Assignment -> Task Details -> Status/Priority/Assignee/Due Update -> Comment -> Activity -> Notification -> Team Member Management

## Current State

The repository contains the six-week documentation, the TeamFlow application implementation, backend API integration tests, and browser regression coverage. Local execution still requires installing project dependencies and providing a MongoDB instance for the real backend.

## Next Build Milestones

1. Run the complete CI suite and resolve any environment-specific failures.
2. Add deployment configuration for the frontend and backend.
3. Add production environment hardening, observability and final accessibility checks.
