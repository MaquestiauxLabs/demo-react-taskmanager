import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import timeEntriesRouter from "../../../routes/timeEntries.routes";
import tasksRouter from "../../../routes/tasks.routes";
import {
  createTestUser,
  createTestTask,
  createTestTimeEntry,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("TimeEntries Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/tasks/:taskId/time-entries", timeEntriesRouter);
    app.use("/api/tasks", tasksRouter);
    app.use("/api/time-entries", timeEntriesRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/tasks/:taskId/time-entries", () => {
    it("should return time entries for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestTimeEntry({ taskId: task.id, creatorId: user.id });
      await createTestTimeEntry({ taskId: task.id, creatorId: user.id });

      const response = await request(app).get(
        `/api/tasks/${task.id}/time-entries`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return empty array when no time entries", async () => {
      const task = await createTestTask();

      const response = await request(app).get(
        `/api/tasks/${task.id}/time-entries`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("POST /api/tasks/:taskId/time-entries", () => {
    it("should create a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const response = await request(app)
        .post(`/api/tasks/${task.id}/time-entries`)
        .send({
          startDate: new Date().toISOString(),
          duration: 2,
          creatorId: user.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.duration).toBe(2);
    });

    it("should return 404 when task not found", async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post("/api/tasks/nonexistent-task-id/time-entries")
        .send({
          startDate: new Date().toISOString(),
          duration: 2,
          creatorId: user.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("POST /api/tasks/:taskId/time-entries/start", () => {
    it("should start a timer", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const response = await request(app)
        .post(`/api/tasks/${task.id}/time-entries/start`)
        .send({
          creatorId: user.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Timer started");
      expect(response.body.data.endDate).toBeNull();
    });

    it("should return 404 when task not found", async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post("/api/tasks/nonexistent-task-id/time-entries/start")
        .send({
          creatorId: user.id,
        });

      expect(response.status).toBe(404);
    });

    it("should return 400 when timer already running", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: null,
      });

      const response = await request(app)
        .post(`/api/tasks/${task.id}/time-entries/start`)
        .send({
          creatorId: user.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "A timer is already running for this task",
      );
    });
  });

  describe("GET /api/time-entries/:id", () => {
    it("should return time entry by ID", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app).get(
        `/api/time-entries/${timeEntry.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(timeEntry.id);
    });

    it("should return 404 when time entry not found", async () => {
      const response = await request(app).get(
        "/api/time-entries/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/time-entries/:id", () => {
    it("should update a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/time-entries/${timeEntry.id}`)
        .send({
          duration: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.duration).toBe(5);
    });

    it("should return 404 when time entry not found", async () => {
      const response = await request(app)
        .put("/api/time-entries/nonexistent-id")
        .send({
          duration: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("POST /api/time-entries/:id/stop", () => {
    it("should stop a timer", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: null,
      });

      const response = await request(app).post(
        `/api/time-entries/${timeEntry.id}/stop`,
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Timer stopped");
      expect(response.body.data.endDate).not.toBeNull();
    });

    it("should return 404 when time entry not found", async () => {
      const response = await request(app).post(
        "/api/time-entries/nonexistent-id/stop",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when timer already stopped", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: new Date(),
      });

      const response = await request(app).post(
        `/api/time-entries/${timeEntry.id}/stop`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Timer already stopped");
    });
  });

  describe("DELETE /api/time-entries/:id", () => {
    it("should delete a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app).delete(
        `/api/time-entries/${timeEntry.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(timeEntry.id);

      const deleted = await prisma.timeEntry.findUnique({
        where: { id: timeEntry.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when time entry not found", async () => {
      const response = await request(app).delete(
        "/api/time-entries/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
