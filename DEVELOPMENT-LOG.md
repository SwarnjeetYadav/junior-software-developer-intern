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
Vitest unit baseline

Source Control
Git and GitHub

## Current State

The source structure and CI definitions are implemented in the repository. Full end to end execution still requires Node.js dependencies and a MongoDB instance. The test files are designed to be executed in the backend environment with npm test.

## Current User Journey

Login -> Workspace -> Projects -> Create Project -> Create Task -> Smart Assignment -> Task Details -> Status Update -> Comment -> Activity -> Notification

## Next Build Milestones

1. Add API integration tests with a disposable MongoDB test database.
2. Replace remaining mock task/project views with live API data.
3. Add project member management UI.
4. Add notification and activity dedicated screens.
5. Add task search and filtering.
6. Prepare deployment configuration and staging environment.


## Phase 4: API Integration Testing

### Completed
- Added a disposable MongoDB integration environment using mongodb-memory-server.
- Added HTTP level API assertions using SuperTest.
- Covered the end to end TeamFlow workflow from authentication through project creation member addition smart assignment comments notifications activity and persistence verification.
- Added a negative authorization scenario for non-member project access.
- Added a dedicated npm script for the integration suite.

### Evidence Path
```text
API request
   -> Express route
   -> Authentication / Authorization
   -> Service layer
   -> MongoDB test database
   -> Response
   -> Persistence assertions
```

### Next Milestone
Replace the remaining frontend demo surfaces with live member, project and task management screens and add browser level regression coverage.
