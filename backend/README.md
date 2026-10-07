# TeamFlow API

Backend for the TeamFlow Smart Task Management and Collaboration Platform.

## Phase 3: Testing and Refactoring

The backend is now structured for the Week 4 and Week 5 engineering phase.

### Current features

- JWT authentication
- Role based authorization
- Projects and project membership
- Tasks and smart assignment
- Activity logging
- Notifications
- Dashboard summary
- Comments
- Centralized API error handling

### Refactoring improvements

- Task status and priority rules are centralized.
- Smart assignment logic is isolated in an assignment service.
- Controllers remain thin and delegate to services.
- Project scoped authorization is kept inside service boundaries.
- Database query responsibilities are kept out of the frontend.
- Internal server errors are not returned directly to clients.

### Automated test baseline

Run:

    npm install
    npm test

Current tests cover:
- Supported and unsupported task priorities
- Supported and unsupported task statuses
- Empty project member handling
- Least loaded smart assignee selection

Additional API integration tests should be added when the MongoDB backed test environment is configured.

### Local setup

1. Copy .env.example to .env.
2. Set MONGODB_URI and JWT_SECRET.
3. Install dependencies.
4. Start MongoDB.
5. Run npm run dev.

The repository intentionally excludes .env and node_modules.
