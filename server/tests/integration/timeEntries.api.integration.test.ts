import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import tasksRouter from "../../routes/tasks.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", tasksRouter);
  return app;
};

describe("Time Entries API integration", () => {
  const app = buildApp();
  let creatorId: string;
  let taskId: string;

  beforeAll(async () => {
    // Ensure DB connection and required seeded entities are available.
    await prisma.$queryRaw`SELECT 1`;

    const creator = await prisma.user.findUnique({
      where: { email: "admin@taskmanager.local" },
      select: { id: true },
    });
    const task = await prisma.task.findFirst({ select: { id: true } });

    if (!creator || !task) {
      throw new Error("Expected seeded creator and task");
    }

    creatorId = creator.id;
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/tasks/:id/time-entries lists entries", async () => {
    const started = await request(app)
      .post(`/api/tasks/${taskId}/time-entries/start`)
      .send({ creatorId });
    expect(started.status).toBe(201);

    const stopped = await request(app).post(
      `/api/tasks/${taskId}/time-entries/${started.body.data.id}/stop`,
    );
    expect(stopped.status).toBe(200);

    const response = await request(app).get(
      `/api/tasks/${taskId}/time-entries`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(`List time entries for task ${taskId}`);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/tasks/:id/time-entries/start starts timer", async () => {
    const started = await request(app)
      .post(`/api/tasks/${taskId}/time-entries/start`)
      .send({ creatorId });

    expect(started.status).toBe(201);
    expect(started.body.message).toBe("Timer started");

    const stopped = await request(app).post(
      `/api/tasks/${taskId}/time-entries/${started.body.data.id}/stop`,
    );

    expect(stopped.status).toBe(200);
    expect(stopped.body.message).toBe("Timer stopped");
  });

  it("POST /api/tasks/:id/time-entries/start returns 404 for missing user", async () => {
    const response = await request(app)
      .post(`/api/tasks/${taskId}/time-entries/start`)
      .send({ creatorId: "missing-user-id" });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("GET /api/tasks/:id/time-entries/:entryId returns 404 for unknown entry", async () => {
    const unknownId = "c123456789012345678901234";
    const response = await request(app).get(
      `/api/tasks/${taskId}/time-entries/${unknownId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/tasks/:id/time-entries/:entryId updates entry", async () => {
    const created = await request(app)
      .post(`/api/tasks/${taskId}/time-entries/start`)
      .send({ creatorId });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/tasks/${taskId}/time-entries/${created.body.data.id}`)
      .send({ duration: 2 });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update time entry with ID");
    expect(updated.body.data.duration).toBe(2);

    const deleted = await request(app).delete(
      `/api/tasks/${taskId}/time-entries/${created.body.data.id}`,
    );
    expect(deleted.status).toBe(200);
  });

  it("DELETE /api/tasks/:id/time-entries/:entryId deletes entry", async () => {
    const created = await request(app)
      .post(`/api/tasks/${taskId}/time-entries/start`)
      .send({ creatorId });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/tasks/${taskId}/time-entries/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete time entry with ID");
  });
});
