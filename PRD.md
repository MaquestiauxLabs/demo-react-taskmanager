# Task Manager - Product Requirements Document (PRD)

## 1. Overview

A collaborative task management application that allows users to create tasks, assign them to one or more team members, organize them into projects, and track progress through customizable statuses.

## 2. Data Models

### 2.1 User (DONE)

Represents a user in the system.

| Field      | Type          | Description                |
| ---------- | ------------- | -------------------------- |
| id         | String (cuid) | Unique identifier          |
| email      | String        | User's email (unique)      |
| givenName  | String        | First name                 |
| familyName | String        | Last name                  |
| avatarUrl  | String?       | Optional avatar image URL  |
| createdAt  | DateTime      | Account creation timestamp |
| updatedAt  | DateTime      | Last update timestamp      |

**Relations:**

- One User → Many Tasks (as creator)
- One User → Many Tasks (as assignee via TaskAssignee)
- One User → Many Projects (as owner)
- One User → Many Comments
- One User → Many ProjectMembers

---

### 2.2 Project

A container for organizing related tasks. A project can be standalone or contain multiple tasks.

| Field       | Type          | Description                  |
| ----------- | ------------- | ---------------------------- |
| id          | String (cuid) | Unique identifier            |
| title       | String        | Project name                 |
| description | String?       | Optional project description |
| ownerId     | String        | User who owns the project    |
| startDate   | DateTime?     | Optional project start date  |
| endDate     | DateTime?     | Optional project end date    |
| createdAt   | DateTime      | Creation timestamp           |
| updatedAt   | DateTime      | Last update timestamp        |

**Relations:**

- One Project → Many Tasks
- One Project → Many Labels
- One Project → Many ProjectMembers
- One Project → Many CustomRoles
- One Project → Many CustomStatuses
- One Project → Many CustomPriorities
- One User → Many Projects (as owner)

---

### 2.3 Task (DONE - needs review)

The core entity representing a work item. Tasks can be standalone or attached to a project. Tasks can be nested recursively (unlimited depth).

| Field          | Type          | Description                                    |
| -------------- | ------------- | ---------------------------------------------- |
| id             | String (cuid) | Unique identifier                              |
| title          | String        | Task title                                     |
| description    | String?       | Detailed task description                      |
| projectId      | String?       | Associated project (null = standalone)         |
| parentId       | String?       | Parent task for subtasks (null = root)         |
| creatorId      | String        | User who created the task                      |
| startDate      | DateTime?     | Optional task start date                       |
| dueDate        | DateTime?     | Optional due date                              |
| estimatedHours | Float?        | Estimated effort in hours                      |
| isRecurring    | Boolean       | Whether task repeats                           |
| recurrenceRule | String?       | RRule string (RFC 5545) for recurrence pattern |
| recurrenceEnd  | DateTime?     | End date for recurring tasks                   |
| createdAt      | DateTime      | Creation timestamp                             |
| updatedAt      | DateTime      | Last update timestamp                          |

**Relations:**

- Many Tasks → One Project (optional)
- Many Tasks → One Task (self-referencing parent for subtasks)
- One Task → Many Tasks (subtasks)
- One Task → Many Comments
- One Task → Many Labels
- One Task → Many TaskAssignees
- One Task → One Status (via TaskStatus)
- One Task → One Priority (via TaskPriority)
- One Task → Many TaskDependencies (as dependent)
- One Task → Many TaskDependencies (as dependency)
- One Task → Many TimeEntries
- One User → Many Tasks (as creator)
- One User → Many TaskAssignees (as assignee)

---

### 2.4 TaskAssignee

Join table for many-to-many relationship between Tasks and Users (assignees).

| Field      | Type          | Description            |
| ---------- | ------------- | ---------------------- |
| id         | String (cuid) | Unique identifier      |
| taskId     | String        | Task ID                |
| userId     | String        | User ID                |
| assignedAt | DateTime      | When user was assigned |

**Relations:**

- Many TaskAssignees → One Task
- Many TaskAssignees → One User

---

### 2.5 Comment

User comments on tasks.

| Field     | Type          | Description                      |
| --------- | ------------- | -------------------------------- |
| id        | String (cuid) | Unique identifier                |
| content   | String        | Comment text (supports markdown) |
| taskId    | String        | Associated task                  |
| authorId  | String        | User who wrote the comment       |
| createdAt | DateTime      | Creation timestamp               |
| updatedAt | DateTime      | Last update timestamp            |

**Relations:**

- Many Comments → One Task
- One User → Many Comments

---

### 2.6 Label

Tags that can be applied to both Projects and Tasks for categorization.

| Field     | Type          | Description                            |
| --------- | ------------- | -------------------------------------- |
| id        | String (cuid) | Unique identifier                      |
| name      | String        | Label name                             |
| color     | String        | Hex color code (e.g., "#FF5733")       |
| projectId | String?       | Project-specific label (null = global) |
| createdAt | DateTime      | Creation timestamp                     |

**Relations:**

- Many Labels → One Project (optional)
- Many Labels → Many Tasks

---

### 2.7 TaskLabel

Join table for many-to-many relationship between Tasks and Labels.

| Field   | Type   | Description |
| ------- | ------ | ----------- |
| taskId  | String | Task ID     |
| labelId | String | Label ID    |

**Relations:**

- Many TaskLabels → One Task
- Many TaskLabels → One Label

---

### 2.8 ProjectMember

Join table for project access management.

| Field     | Type          | Description              |
| --------- | ------------- | ------------------------ |
| id        | String (cuid) | Unique identifier        |
| projectId | String        | Project ID               |
| userId    | String        | User ID                  |
| roleId    | String        | Role ID                  |
| joinedAt  | DateTime      | When user joined project |

**Relations:**

- Many ProjectMembers → One Project
- Many ProjectMembers → One User
- Many ProjectMembers → One Role

---

### 2.9 Role

Represents project membership roles. Can be global (default) or project-specific.

| Field     | Type          | Description                                |
| --------- | ------------- | ------------------------------------------ |
| id        | String (cuid) | Unique identifier                          |
| name      | String        | Role name (e.g., "Owner", "Admin")         |
| color     | String        | Hex color for UI display                   |
| sortOrder | Integer       | Display order in lists                     |
| projectId | String?       | Associated project (null = global default) |
| createdAt | DateTime      | Creation timestamp                         |

**Global Defaults (seed data):**

| Name   | Color           | Sort Order |
| ------ | --------------- | ---------- |
| Owner  | #EF4444 (red)   | 1          |
| Admin  | #F59E0B (amber) | 2          |
| Member | #3B82F6 (blue)  | 3          |
| Viewer | #6B7280 (gray)  | 4          |

**How Custom Roles Work:**

- Global roles (projectId = null) are available to all projects
- Projects can add custom roles (projectId = set) that extend global ones
- When querying project members, if no custom role exists for a project, fall back to global roles

**Validation:** A project cannot delete a role that is currently assigned to project members.

---

### 2.10 Status

Join table linking a Task to its Status.

| Field    | Type          | Description       |
| -------- | ------------- | ----------------- |
| id       | String (cuid) | Unique identifier |
| taskId   | String        | Task ID           |
| statusId | String        | Status ID         |

**Validation:** The Status must either be global OR belong to the task's project.

---

### 2.11 Priority

Represents task priorities. Can be global (default) or project-specific.

| Field     | Type          | Description                                |
| --------- | ------------- | ------------------------------------------ |
| id        | String (cuid) | Unique identifier                          |
| name      | String        | Priority name (e.g., "Low", "High")        |
| color     | String        | Hex color for UI display                   |
| sortOrder | Integer       | Display order in lists                     |
| projectId | String?       | Associated project (null = global default) |
| createdAt | DateTime      | Creation timestamp                         |

**Global Defaults (seed data):**

| Name   | Color           | Sort Order |
| ------ | --------------- | ---------- |
| Low    | #6B7280 (gray)  | 1          |
| Medium | #3B82F6 (blue)  | 2          |
| High   | #F59E0B (amber) | 3          |
| Urgent | #EF4444 (red)   | 4          |

**How Custom Priorities Work:**

- Global priorities (projectId = null) are available to all projects
- Projects can add custom priorities (projectId = set) that extend global ones
- When querying tasks, if no custom priority exists for a project, fall back to global priorities

---

### 2.12 TaskPriority

Join table linking a Task to its Priority.

| Field      | Type          | Description       |
| ---------- | ------------- | ----------------- |
| id         | String (cuid) | Unique identifier |
| taskId     | String        | Task ID           |
| priorityId | String        | Priority ID       |

**Validation:** The Priority must either be global OR belong to the task's project.

---

### 2.13 ProjectStatus

Join table linking a Project to its Status.

| Field     | Type          | Description       |
| --------- | ------------- | ----------------- |
| id        | String (cuid) | Unique identifier |
| projectId | String        | Project ID        |
| statusId  | String        | Status ID         |

**Validation:** The Status must either be global OR belong to this project.

---

### 2.14 TaskDependency

Represents task dependencies (blocking/blocked relationships).

| Field           | Type           | Description                           |
| --------------- | -------------- | ------------------------------------- |
| id              | String (cuid)  | Unique identifier                     |
| taskId          | String         | The task that has the dependency      |
| dependsOnTaskId | String         | The task that must be completed first |
| dependencyType  | DependencyType | Type of dependency                    |
| createdAt       | DateTime       | Creation timestamp                    |

**Types:**

- `BLOCKS` - This task blocks the other task
- `IS_BLOCKED_BY` - This task is blocked by the other task

**Relations:**

- Many TaskDependencies → One Task (the dependent task)
- Many TaskDependencies → One Task (the dependency)

**Validation:** A task cannot depend on itself. Circular dependencies should be prevented.

---

### 2.15 TimeEntry

Tracks time spent on tasks.

| Field       | Type          | Description                |
| ----------- | ------------- | -------------------------- |
| id          | String (cuid) | Unique identifier          |
| taskId      | String        | Task being tracked         |
| userId      | String        | User who logged the time   |
| startTime   | DateTime      | When time tracking started |
| endTime     | DateTime?     | When time tracking ended   |
| duration    | Integer       | Duration in minutes        |
| description | String?       | Optional description       |
| createdAt   | DateTime      | Creation timestamp         |
| updatedAt   | DateTime      | Last update timestamp      |

**Note:** If endTime is null and duration is null, time entry is currently "running".

**Relations:**

- Many TimeEntries → One Task
- Many TimeEntries → One User

---

### 2.16 ActivityLog

Tracks all actions performed in the system for audit and history purposes.

| Field      | Type          | Description                          |
| ---------- | ------------- | ------------------------------------ |
| id         | String (cuid) | Unique identifier                    |
| userId     | String        | User who performed the action        |
| entityType | EntityType    | Type of entity (TASK, PROJECT, etc.) |
| entityId   | String        | ID of the affected entity            |
| action     | ActionType    | Type of action performed             |
| oldValue   | JSON?         | Previous value (for updates)         |
| newValue   | JSON?         | New value (for creates/updates)      |
| createdAt  | DateTime      | When the action occurred             |

**Entity Types:**

```prisma
enum EntityType {
  TASK
  PROJECT
  COMMENT
  LABEL
  USER
  PROJECT_MEMBER
}
```

**Action Types:**

```prisma
enum ActionType {
  CREATE
  UPDATE
  DELETE
  ASSIGN
  UNASSIGN
  STATUS_CHANGE
  PRIORITY_CHANGE
  COMMENT_ADDED
  LABEL_ADDED
  LABEL_REMOVED
}
```

**Relations:**

- Many ActivityLogs → One User

**Notes:**

- Automatically created for all major actions
- Immutable (cannot be edited or deleted)
- Queryable by entity type, entity ID, user, or date range

---

## 3. Entity Relationship Diagram

```text
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User     │       │   TaskAssignee   │       │    Task     │
│─────────────│◄──────│──────────────────│───────│─────────────│
│ id          │       │ id               │       │ id          │
│ email       │       │ taskId           │◄──────│ title       │
│ givenName   │       │ userId           │       │ description │
│ familyName  │───────│ assignedAt       │       │ projectId   │
│ avatarUrl   │       └──────────────────┘       │ parentId    │
└─────────────┘                                  │ creatorId   │
                                                 │ startDate   │
┌─────────────┐       ┌─────────────┐            │ dueDate     │
│   Project   │       │ProjectMember│            └──────┬──────┘
│─────────────│◄──────│─────────────│                   │
│ id          │       │ id          │       ┌───────────┴─────────┐
│ title       │       │ projectId   │       │                     │
│ description │       │ userId      │       ▼                     ▼
│ ownerId     │       │ roleId      │  ┌─────────────┐    ┌─────────────┐
│ ...         │───────│ joinedAt    │  │   Task      │    │   Comment   │
└──────┬──────┘       └─────────────┘  │(subtask)    │    │─────────────│
       │                               │─────────────│    │ id          │
       │       ┌─────────────┐         │ id          │    │ content     │
       │       │   Status    │         │ parentId────┼────│ taskId      │
       └───────│─────────────│         │ ...         │    │ authorId    │
               │ id          │         └─────────────┘    │ ...         │
               │ name        │                            └─────────────┘
               │ category    │
               │ color       │        ┌──────────────────┐
               │ sortOrder   │        │   TaskLabel      │
               │ projectId   │        │──────────────────│
               └─────────────┘        │ taskId           │
                                      │ labelId          │
                                      └──────────────────┘

       ┌─────────────────────────────────────────────────────────┐
       │                    ProjectStatus                        │
       │────────────────────│────────────────────────────────────│
       │ projectId          │ statusId (FK → Status)             │
       └────────────────────┴────────────────────────────────────┘

       ┌─────────────────────────────────────────────────────────┐
       │                    TaskStatus                           │
       │────────────────────│────────────────────────────────────│
       │ taskId             │ statusId (FK → Status)             │
       └────────────────────┴────────────────────────────────────┘

       ┌─────────────┐       ┌────────────────────────────────────┐
       │  Priority   │       │         TaskPriority               │
       │─────────────│◄──────│────────────────────────────────────│
       │ id          │       │ taskId                             │
       │ name        │       │ priorityId (FK → Priority)         │
       │ color       │       └────────────────────────────────────┘
       │ sortOrder   │
       │ projectId   │
       └─────────────┘

       ┌─────────────┐       ┌────────────────────────────────────┐
       │    Role     │       │       ProjectMember                │
       │─────────────│◄──────│────────────────────────────────────│
       │ id          │       │ projectId                          │
       │ name        │       │ userId                             │
       │ color       │       │ roleId (FK → Role)                 │
       │ sortOrder   │       │ joinedAt                           │
       │ projectId   │       └────────────────────────────────────┘
       └─────────────┘

       ┌─────────────────────┐       ┌────────────────────────────────────┐
       │  TaskDependency     │       │        TimeEntry                   │
       │─────────────────────│◄──────│────────────────────────────────────│
       │ id                  │       │ id                                 │
       │ taskId              │       │ taskId                             │
       │ dependsOnTaskId     │       │ userId                             │
       │ dependencyType      │       │ startTime                          │
       └─────────────────────┘       │ endTime                            │
                                     │ duration                           │
                                     │ description                        │
                                     └────────────────────────────────────┘
```

**Note:**

- Task has a self-referencing `parentId` field, allowing unlimited nesting depth
- Role, Status, Priority, and Label all follow the same pattern: global defaults (projectId = null) + project-specific extensions
- Tasks can have dependencies (blocking/blocked) via TaskDependency
- Time tracking is available via TimeEntry
- Recurring tasks use RFC 5545 RRule stored in the Task model
- All system actions are logged in ActivityLog for audit purposes

---

## 4. Key Features Summary

| Feature                 | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| Multi-assignee          | Tasks can be assigned to multiple users                            |
| Project association     | Tasks can belong to a project or be standalone                     |
| Hierarchical tasks      | Tasks can have sub-tasks with unlimited depth (recursive)          |
| Customizable statuses   | Global base statuses + project-specific extensions                 |
| Customizable priorities | Global base priorities + project-specific extensions               |
| Customizable roles      | Global base roles + project-specific extensions                    |
| Task dependencies       | Tasks can block or be blocked by other tasks                       |
| Time tracking           | Log time spent on tasks                                            |
| Recurring tasks         | Tasks can repeat based on RFC 5545 recurrence rules                |
| Activity log            | Complete audit trail of all actions in the system                  |
| Comments                | Threaded comments on tasks                                         |
| Labels                  | Color-coded labels for categorization (project-specific or global) |
| Date tracking           | Start dates, due dates, estimated hours                            |

---

## 5. API Endpoints (Suggested)

### Users

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| GET    | /api/users     | List all users |
| POST   | /api/users     | Create a user  |
| GET    | /api/users/:id | Get user by ID |
| PUT    | /api/users/:id | Update user    |
| DELETE | /api/users/:id | Delete user    |

### Projects

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| GET    | /api/projects                     | List all projects          |
| POST   | /api/projects                     | Create a project           |
| GET    | /api/projects/:id                 | Get project by ID          |
| PUT    | /api/projects/:id                 | Update project             |
| DELETE | /api/projects/:id                 | Delete project             |
| GET    | /api/projects/:id/members         | List project members       |
| POST   | /api/projects/:id/members         | Add member to project      |
| DELETE | /api/projects/:id/members/:userId | Remove member from project |

### Tasks

| Method | Endpoint                           | Description                                      |
| ------ | ---------------------------------- | ------------------------------------------------ |
| GET    | /api/tasks                         | List tasks (filter by project, status, assignee) |
| POST   | /api/tasks                         | Create a task                                    |
| GET    | /api/tasks/:id                     | Get task by ID                                   |
| PUT    | /api/tasks/:id                     | Update task                                      |
| DELETE | /api/tasks/:id                     | Delete task                                      |
| POST   | /api/tasks/:id/assignees           | Assign user(s) to task                           |
| DELETE | /api/tasks/:id/assignees/:userId   | Remove assignee from task                        |
| GET    | /api/tasks/:id/subtasks            | List sub-tasks                                   |
| POST   | /api/tasks/:id/subtasks            | Create sub-task                                  |
| PUT    | /api/tasks/:id/subtasks/:subtaskId | Update sub-task                                  |
| DELETE | /api/tasks/:id/subtasks/:subtaskId | Delete sub-task                                  |

### Statuses

| Method | Endpoint                       | Description                                   |
| ------ | ------------------------------ | --------------------------------------------- |
| GET    | /api/statuses                  | List global statuses                          |
| GET    | /api/projects/:id/statuses     | List statuses for a project (includes global) |
| POST   | /api/projects/:id/statuses     | Add custom status to project                  |
| DELETE | /api/projects/:id/statuses/:id | Remove custom status from project             |

### Priorities

| Method | Endpoint                         | Description                                     |
| ------ | -------------------------------- | ----------------------------------------------- |
| GET    | /api/priorities                  | List global priorities                          |
| GET    | /api/projects/:id/priorities     | List priorities for a project (includes global) |
| POST   | /api/projects/:id/priorities     | Add custom priority to project                  |
| DELETE | /api/projects/:id/priorities/:id | Remove custom priority from project             |

### Roles

| Method | Endpoint                    | Description                                |
| ------ | --------------------------- | ------------------------------------------ |
| GET    | /api/roles                  | List global roles                          |
| GET    | /api/projects/:id/roles     | List roles for a project (includes global) |
| POST   | /api/projects/:id/roles     | Add custom role to project                 |
| DELETE | /api/projects/:id/roles/:id | Remove custom role from project            |

### Comments

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | /api/tasks/:id/comments | List comments for a task |
| POST   | /api/tasks/:id/comments | Add comment to task      |
| PUT    | /api/comments/:id       | Update comment           |
| DELETE | /api/comments/:id       | Delete comment           |

### Labels

| Method | Endpoint                       | Description                               |
| ------ | ------------------------------ | ----------------------------------------- |
| GET    | /api/labels                    | List all labels                           |
| GET    | /api/projects/:id/labels       | List labels for project (includes global) |
| POST   | /api/labels                    | Create a label                            |
| PUT    | /api/labels/:id                | Update label                              |
| DELETE | /api/labels/:id                | Delete label                              |
| POST   | /api/tasks/:id/labels          | Add label to task                         |
| DELETE | /api/tasks/:id/labels/:labelId | Remove label from task                    |

### Task Dependencies

| Method | Endpoint                           | Description                      |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | /api/tasks/:id/dependencies        | List dependencies for a task     |
| POST   | /api/tasks/:id/dependencies        | Add dependency (blocking task)   |
| DELETE | /api/tasks/:id/dependencies/:depId | Remove dependency                |
| GET    | /api/tasks/:id/blocking            | List tasks that this task blocks |
| GET    | /api/tasks/:id/blocked-by          | List tasks that block this task  |

### Time Tracking

| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | /api/tasks/:id/time-entries | List time entries for a task |
| POST   | /api/tasks/:id/time-entries | Start/stop time tracking     |
| PUT    | /api/time-entries/:id       | Update time entry            |
| DELETE | /api/time-entries/:id       | Delete time entry            |
| POST   | /api/time-entries/:id/stop  | Stop running time entry      |

### Activity Log

| Method | Endpoint                              | Description                             |
| ------ | ------------------------------------- | --------------------------------------- |
| GET    | /api/activity-logs                    | List all activity logs (paginated)      |
| GET    | /api/activity-logs/entity/:type/:id   | Get activity logs for a specific entity |
| GET    | /api/activity-logs/user/:userId       | Get activity logs by user               |
| GET    | /api/activity-logs/project/:projectId | Get activity logs for a project         |

---

## 6. Future Considerations

- File attachments
- Notifications
- Search and filtering
- Task templates
- Due date reminders
