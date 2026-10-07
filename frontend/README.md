# TeamFlow Web

The frontend for the TeamFlow Smart Task Management and Collaboration Platform.

## Current phase

Phase 1 establishes the reusable visual foundation of the product. The app includes a responsive workspace shell, dashboard, project cards, task table, activity feed, workload view, reports, settings, and a reusable task creation modal with a workload-aware smart assignment preview.

The current release intentionally uses mock data so the experience can be built and reviewed before API and database integration.

## Structure

- `src/components` — reusable UI components
- `src/data` — mock/domain data used by the prototype
- `src/pages` — page level compositions
- `src/App.jsx` — application state and navigation

## Run locally

```bash
npm install
npm run dev
```

## Product sequence

1. Reusable frontend foundation
2. API and MongoDB integration
3. Authentication and role based access
4. Project and task CRUD
5. Smart assignment service
6. Notifications, activity history, and reports
7. Automated testing and refinement

## Design principles

- Feature based component composition
- Reusable visual primitives
- Data driven UI
- Responsive layouts
- Thin page components
- Clear separation between UI data and business logic
