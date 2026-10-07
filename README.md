# Junior Software Developer Internship

## Project

**TeamFlow - Smart Task Management and Collaboration Platform**

This repository records the weekly internship documentation and the actual TeamFlow project build.

## Internship

- Organization: YuvaIntern
- Role: Junior Software Developer Intern
- Mode: Remote
- Duration: 6 weeks
- Start Date: 29 September 2026
- End Date: 10 November 2026

## Project Status

**Documentation completed and application development in progress with live API integration and browser regression coverage.**

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

The React frontend is implemented under frontend.

- Responsive TeamFlow workspace
- Live authenticated workspace loading
- Live project listing and creation
- Project-aware live task creation
- Live task filtering by status and priority
- Live task updates for status, priority, assignee and due date
- Live task comments
- Live project progress and member counts
- Live team workload aggregation
- Live project member search and add flow
- Notification popover with mark-as-read
- Activity feed
- Demo mode for UI review
- Playwright browser regression suite

### Backend

The Express and MongoDB backend is implemented under backend.

- Authentication and JWT
- Role based access
- Projects
- Project membership
- Member candidate search
- Tasks
- Smart assignment
- Activity logging
- Notifications
- Dashboard summary
- Centralized error handling
- Vitest unit tests
- Disposable MongoDB integration tests

## CI

GitHub Actions validates:

- Backend unit tests
- Backend API integration tests
- Frontend production build
- Chromium browser regression tests

## Repository Structure

- Week-1-Project-Planning
- Week-2-System-Design
- Week-3-Core-Development
- Week-4-Feature-Development
- Week-5-Integration-and-Refinement
- Week-6-Testing-and-Final-Review
- frontend
- backend

## Actual Application Build

The six-week documentation is now being used as the engineering blueprint for the TeamFlow application.

See DEVELOPMENT-LOG.md for the implementation history and next milestones.
