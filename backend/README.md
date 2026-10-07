# TeamFlow API

Backend foundation for the TeamFlow Smart Task Management and Collaboration Platform.

## Current Phase

Phase 2 adds the Express and MongoDB backend foundation aligned with the Week 2 architecture and Week 3 feature prototype.

## Implemented

- Health endpoint
- JWT authentication
- User registration and login
- Role based authorization
- Project creation and listing
- Project scoped access checks
- Task creation and listing
- Task update for status priority assignee and due date
- Workload aware smart assignment
- Activity logging
- In application assignment notifications
- Dashboard summary
- Centralized API error handling

## API Base

/api/v1

## Endpoints

POST /auth/register
POST /auth/login
GET /auth/me
GET /projects
POST /projects
GET /projects/:projectId
GET /tasks/project/:projectId
POST /tasks/project/:projectId
PATCH /tasks/:taskId
GET /dashboard/summary
GET /health

## Setup

Copy .env.example to .env and provide MONGODB_URI and JWT_SECRET.

Install dependencies with npm install and run npm run dev.

## Security

Do not commit .env or secrets. Passwords are stored as hashes. Protected endpoints require a Bearer access token. Project membership is checked before project scoped operations and backend validation remains authoritative.
