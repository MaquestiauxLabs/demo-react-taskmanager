# Project Summary: React Task Manager Demo

## Overview

A full-stack **Task Manager** monorepo (v0.1.1) by Jean-Philippe Maquestiaux.
The backend is feature-complete; the **frontend is essentially a blank slate** with only a folder structure and a placeholder component.

---

## Architecture

```
Monorepo Root (package.json — concurrently)
├── client/   React 19 + TypeScript + Vite 7 + Tailwind CSS v4
└── server/   Express 5 + TypeScript + Prisma 7 + PostgreSQL
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so there are no CORS issues during development.

---

## Backend (`server/`) — Feature-Complete

**Stack:** Express 5, TypeScript, Prisma 7, PostgreSQL, Vitest, Swagger UI

### Layer Structure

| Layer                              | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `routes/`                          | HTTP routing with JSDoc Swagger annotations              |
| `controllers/`                     | Thin request/response handlers                           |
| `services/`                        | Business logic (e.g. `tasks.service.ts` is ~1 443 lines) |
| `middlewares/`                     | Global error handler                                     |
| `helpers/`, `utils/`, `constants/` | Shared utilities                                         |
| `prisma/`                          | Schema, migrations, seed data, generated Zod types       |

### API Endpoints

| Resource     | Base Path                     | Operations                                                                       |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------- |
| Users        | `/api/users`                  | CRUD                                                                             |
| Tasks        | `/api/tasks`                  | CRUD + labels, priority, status, project, archive/unarchive, assignees, watchers |
| Time Entries | `/api/tasks/:id/time-entries` | CRUD (nested under tasks)                                                        |
| Projects     | `/api/projects`               | CRUD + archive/unarchive, assignees                                              |
| Comments     | `/api/…/comments`             | Nested under tasks and projects                                                  |
| Labels       | `/api/labels`                 | CRUD                                                                             |
| Statuses     | `/api/statuses`               | CRUD                                                                             |
| Priorities   | `/api/priorities`             | CRUD                                                                             |
| Roles        | `/api/roles`                  | CRUD                                                                             |

Interactive Swagger documentation is available at **http://localhost:3000/api-docs** when the server is running.

---

## Database Schema (Prisma → PostgreSQL)

### Entities

| Model       | Key Fields                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `User`      | id, email, givenName, familyName, avatarUrl                                                                                                      |
| `Task`      | id, title, description, parentId _(subtask nesting)_, creatorId, priorityId, statusId, projectId, startDate, dueDate, estimatedHours, isArchived |
| `Project`   | id, title, description, ownerId, startDate, endDate, priorityId, statusId, isArchived                                                            |
| `TimeEntry` | id, taskId, creatorId, startDate, endDate, duration, description                                                                                 |
| `Comment`   | id, content, authorId                                                                                                                            |
| `Label`     | id, name, color, ownerId                                                                                                                         |
| `Status`    | id, name, color, ownerId                                                                                                                         |
| `Priority`  | id, name, color, ownerId                                                                                                                         |
| `Role`      | id, name, color, ownerId                                                                                                                         |

### Relationships

- `Task` → self-referential via `parentId` (subtask nesting)
- `Task` ↔ `Project` — optional many-to-one
- `Task` ↔ `User` — many-to-many (assignees via `_UserTask`, watchers via `_TaskWatcher`)
- `Task` ↔ `Label` — many-to-many (via `_TaskLabel`)
- `Task` ↔ `Comment` — many-to-many (via `_CommentTask`)
- `Project` ↔ `User` — many-to-many (via `_UserProject`)
- `Project` ↔ `Label` — many-to-many (via `_ProjectLabel`)
- `Project` ↔ `Comment` — many-to-many (via `_CommentProject`)
- `TimeEntry` → `Task` — many-to-one

---

## Frontend (`client/`) — Skeleton Only

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4

**No additional libraries are installed yet** — no router, no data-fetching library, no form library, no state manager.

### Current State of `src/`

```
src/
├── App.tsx               ← placeholder only: "Hello task manager"
├── main.tsx              ← standard React root
├── index.css             ← Tailwind base styles
├── api/
│   └── endpoints/        ← empty (README only)
├── components/
│   ├── feedback/         ← empty
│   ├── forms/            ← empty
│   ├── layout/           ← empty
│   └── ui/               ← empty (UI kit)
├── context/              ← empty
├── features/             ← empty (feature-based modules)
├── hooks/                ← empty
├── libs/                 ← empty
├── pages/                ← empty
├── providers/            ← empty
├── styles/               ← empty
├── types/                ← empty
└── utils/                ← empty
```

The folder structure is intentional and pre-scaffolded, suggesting a **feature-based architecture**.

---

## Key Observations Before Building the Frontend

1. **No routing library** — React Router or TanStack Router must be added.
2. **No data-fetching** — TanStack Query (`@tanstack/react-query`) would pair naturally with the REST API.
3. **No authentication** — The API has no auth layer. Users are manually managed; `creatorId`/`ownerId` fields are required on most resources.
4. **No form library** — React Hook Form + Zod would be a natural fit.
5. **Zod schemas are already generated** in `server/prisma/generated/` by `prisma-zod-generator` — these could be referenced or replicated on the client for validation consistency.
6. **The proxy is ready** — Vite forwards `/api` to `http://localhost:3000`, so the API client layer can use relative paths.

---

## Development Scripts

| Command                              | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `npm run dev`                        | Start client + server concurrently               |
| `npm run start:client`               | Start Vite dev server only                       |
| `npm run start:server`               | Start Express server only (with Prisma generate) |
| `npm run db:start`                   | Start PostgreSQL via Docker Compose              |
| `npm run db:stop`                    | Stop PostgreSQL container                        |
| `npm run db:status`                  | Show container status                            |
| `cd server && npm run test`          | Run Vitest test suite                            |
| `cd server && npm run prisma:studio` | Open Prisma Studio (database GUI)                |
| `cd server && npm run prisma:seed`   | Seed the database                                |

---

## Getting Started

```bash
# 1. Install dependencies
cd client && npm install
cd ../server && npm install

# 2. Start the database
npm run db:start   # from the monorepo root

# 3. Push schema and seed (from server/)
cd server
npm run prisma:push
npm run prisma:seed

# 4. Start both client and server
cd ..
npm run dev
```
