import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
  mockIsPrismaNotFoundError,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      task: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      priority: {
        findUnique: vi.fn(),
      },
      status: {
        findUnique: vi.fn(),
      },
      project: {
        findUnique: vi.fn(),
      },
      label: {
        findMany: vi.fn(),
      },
      taskLabel: {
        findMany: vi.fn(),
      },
    },
    mockIsPrismaConflictError: vi.fn(() => false),
    mockIsPrismaForeignKeyError: vi.fn(() => false),
    mockIsPrismaNotFoundError: vi.fn(() => false),
  };
});

vi.mock("../../utils", () => ({
  prisma: mockPrisma,
  standardiseResponse: ({
    message,
    httpStatus,
    data,
    error,
    pagination,
    sorting,
  }: {
    message: string;
    httpStatus: number;
    data?: unknown;
    error?: unknown;
    pagination?: unknown;
    sorting?: unknown;
  }) => ({
    message,
    httpStatus,
    data,
    error,
    pagination,
    sorting,
  }),
  isPrismaConflictError: mockIsPrismaConflictError,
  isPrismaForeignKeyError: mockIsPrismaForeignKeyError,
  isPrismaNotFoundError: mockIsPrismaNotFoundError,
  normalizeTaskWithDetails: <T>(entity: T) => entity,
  normalizeManyTasksWithDetails: <T>(entities: T[]) => entities,
}));

import tasksRouter from "../tasks.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", tasksRouter);
  return app;
};

describe("Tasks API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/tasks returns 404 when no tasks exist", async () => {
    mockPrisma.task.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/tasks");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No tasks found");
  });

  it("GET /api/tasks returns list of tasks", async () => {
    const tasks = [{ id: "t1", title: "Task A", isArchived: false }];
    mockPrisma.task.findMany.mockResolvedValueOnce(tasks);

    const response = await request(buildApp()).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all tasks");
    expect(response.body.data).toEqual(tasks);
  });

  it("POST /api/tasks validates missing title", async () => {
    const response = await request(buildApp())
      .post("/api/tasks")
      .send({ creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("title is required");
  });

  it("POST /api/tasks creates a task", async () => {
    const created = { id: "t1", title: "Task A", creatorId: "u1" };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/tasks").send({
      title: "Task A",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a task");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/tasks/:id returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/tasks/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("PUT /api/tasks/:id validates empty update payload", async () => {
    const response = await request(buildApp()).put("/api/tasks/t1").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "At least one field is required to update a task",
    );
  });

  it("DELETE /api/tasks/:id returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/tasks/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("POST /api/tasks/:id/labels validates non-empty labelIds", async () => {
    const response = await request(buildApp())
      .post("/api/tasks/t1/labels")
      .send({ labelIds: [] });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("labelIds must be a non-empty array");
  });

  it("POST /api/tasks/:id/labels adds labels", async () => {
    const updated = { id: "t1", labelLinks: [] };

    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.label.findMany.mockResolvedValueOnce([{ id: "l1" }]);
    mockPrisma.taskLabel.findMany.mockResolvedValueOnce([]);
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .post("/api/tasks/t1/labels")
      .send({ labelIds: ["l1"] });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Add labels to task t1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/tasks/:id/labels returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .delete("/api/tasks/missing/labels")
      .send({ labelIds: ["l1"] });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("PUT /api/tasks/:id/priority validates missing priorityId", async () => {
    const response = await request(buildApp())
      .put("/api/tasks/t1/priority")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("priorityId is required");
  });

  it("PUT /api/tasks/:id/priority sets task priority", async () => {
    const updated = { id: "t1", priorityId: "p1" };

    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.priority.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/tasks/t1/priority")
      .send({ priorityId: "p1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Set priority for task t1");
    expect(response.body.data).toEqual(updated);
  });

  it("PUT /api/tasks/:id/status validates missing statusId", async () => {
    const response = await request(buildApp())
      .put("/api/tasks/t1/status")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("statusId is required");
  });

  it("PUT /api/tasks/:id/project validates missing projectId", async () => {
    const response = await request(buildApp())
      .put("/api/tasks/t1/project")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("projectId is required");
  });

  it("DELETE /api/tasks/:id/project returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/tasks/missing/project");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("PUT /api/tasks/:id/archive archives a task", async () => {
    const updated = { id: "t1", isArchived: true };
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp()).put("/api/tasks/t1/archive");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Archive task with ID: t1");
    expect(response.body.data).toEqual(updated);
  });

  it("PUT /api/tasks/:id/unarchive unarchives a task", async () => {
    const updated = { id: "t1", isArchived: false };
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp()).put("/api/tasks/t1/unarchive");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Unarchive task with ID: t1");
    expect(response.body.data).toEqual(updated);
  });

  it("POST /api/tasks/:id/assignee validates missing userId", async () => {
    const response = await request(buildApp())
      .post("/api/tasks/t1/assignee")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("userId is required");
  });

  it("POST /api/tasks/:id/assignee assigns a user", async () => {
    const updated = { id: "t1" };
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .post("/api/tasks/t1/assignee")
      .send({ userId: "u1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Assign user u1 to task t1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/tasks/:id/assignee validates missing userId", async () => {
    const response = await request(buildApp())
      .delete("/api/tasks/t1/assignee")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("userId is required");
  });

  it("POST /api/tasks/:id/watchers validates missing userId", async () => {
    const response = await request(buildApp())
      .post("/api/tasks/t1/watchers")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("userId is required");
  });

  it("DELETE /api/tasks/:id/watchers validates missing userId", async () => {
    const response = await request(buildApp())
      .delete("/api/tasks/t1/watchers")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("userId is required");
  });
});
