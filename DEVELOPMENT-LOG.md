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

Source Control
Git and GitHub

## Current State

The source structure is implemented in the repository. The local environment still needs Node.js dependencies and a MongoDB instance configured before the API can be executed end to end.

## Next Build Milestones

1. Project creation and member management UI
2. API backed task creation from the frontend
3. Task detail and comments
4. Activity history and notifications UI
5. Automated unit and integration tests
6. Production deployment configuration

## Milestone: Live Task Workflow

### Completed
- Create Task now supports live API submission for authenticated users.
- Backend smart assignment runs when no explicit assignee is selected.
- Project member workload is calculated from live task data for the first project.
- Task rows open a reusable Task Details modal.
- Live task status updates call PATCH /tasks/:taskId.
- Task comments are persisted through the comment API.
- User activity is loaded from the backend.
- Assignment notifications are loaded and can be marked as read from the topbar.
- Project creation remains API backed.

### Current User Journey
Login -> Workspace -> Projects -> Create Project -> Create Task -> Smart Assignment -> Task Details -> Status Update -> Comment -> Activity / Notification

### Next Milestone
Automated backend tests and stronger data-driven task/project views, followed by notification/activity refinements and production deployment configuration.
