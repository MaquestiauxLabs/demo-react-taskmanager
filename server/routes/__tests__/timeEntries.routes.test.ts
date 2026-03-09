import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      timeEntry: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      task: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    },
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
}));

import tasksRouter from "../tasks.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", tasksRouter);
  return app;
};

describe("TimeEntries API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/tasks/:id/time-entries lists entries", async () => {
    const entries = [{ id: "te1", taskId: "t1" }];
    mockPrisma.timeEntry.findMany.mockResolvedValueOnce(entries);

    const response = await request(buildApp()).get(
      "/api/tasks/t1/time-entries",
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List time entries for task t1");
    expect(response.body.data).toEqual(entries);
  });

  it("POST /api/tasks/:id/time-entries returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .post("/api/tasks/missing/time-entries")
      .send({
        creatorId: "u1",
        startDate: new Date().toISOString(),
        duration: 1,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("POST /api/tasks/:id/time-entries creates entry", async () => {
    const created = { id: "te1", taskId: "t1" };
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.timeEntry.create.mockResolvedValueOnce(created);

    const response = await request(buildApp())
      .post("/api/tasks/t1/time-entries")
      .send({
        creatorId: "u1",
        startDate: new Date().toISOString(),
        duration: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create time entry");
    expect(response.body.data).toEqual(created);
  });

  it("POST /api/tasks/:id/time-entries/start validates missing task", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .post("/api/tasks/missing/time-entries/start")
      .send({ creatorId: "u1" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("POST /api/tasks/:id/time-entries/start validates missing user", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .post("/api/tasks/t1/time-entries/start")
      .send({ creatorId: "missing-user" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User with ID missing-user not found");
  });

  it("POST /api/tasks/:id/time-entries/start rejects when timer already running", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.timeEntry.findFirst.mockResolvedValueOnce({ id: "running" });

    const response = await request(buildApp())
      .post("/api/tasks/t1/time-entries/start")
      .send({ creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "A timer is already running for this task",
    );
  });

  it("POST /api/tasks/:id/time-entries/start starts timer", async () => {
    const created = { id: "te1", taskId: "t1", creatorId: "u1", duration: 0 };
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.timeEntry.findFirst.mockResolvedValueOnce(null);
    mockPrisma.timeEntry.create.mockResolvedValueOnce(created);

    const response = await request(buildApp())
      .post("/api/tasks/t1/time-entries/start")
      .send({ creatorId: "u1" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Timer started");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/tasks/:id/time-entries/:id returns 404 when entry is missing", async () => {
    mockPrisma.timeEntry.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get(
      "/api/tasks/t1/time-entries/missing",
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Time entry with ID missing not found");
  });

  it("PUT /api/tasks/:id/time-entries/:id returns 404 when entry is missing", async () => {
    mockPrisma.timeEntry.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .put("/api/tasks/t1/time-entries/missing")
      .send({ duration: 2 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Time entry with ID missing not found");
  });

  it("POST /api/tasks/:id/time-entries/:id/stop rejects stopped timer", async () => {
    mockPrisma.timeEntry.findUnique.mockResolvedValueOnce({
      id: "te1",
      startDate: new Date(),
      endDate: new Date(),
    });

    const response = await request(buildApp()).post(
      "/api/tasks/t1/time-entries/te1/stop",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Timer already stopped");
  });

  it("POST /api/tasks/:id/time-entries/:id/stop stops timer", async () => {
    const updated = { id: "te1", endDate: new Date().toISOString() };
    mockPrisma.timeEntry.findUnique.mockResolvedValueOnce({
      id: "te1",
      startDate: new Date(Date.now() - 1000 * 60 * 60),
      endDate: null,
    });
    mockPrisma.timeEntry.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp()).post(
      "/api/tasks/t1/time-entries/te1/stop",
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Timer stopped");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/tasks/:id/time-entries/:id handles delete", async () => {
    mockPrisma.timeEntry.delete.mockResolvedValueOnce({ id: "te1" });

    const response = await request(buildApp()).delete(
      "/api/tasks/t1/time-entries/te1",
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete time entry with ID: te1");
  });
});
