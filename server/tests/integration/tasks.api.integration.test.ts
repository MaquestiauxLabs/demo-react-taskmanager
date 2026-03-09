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

describe("Tasks API integration", () => {
  const app = buildApp();
  let creatorId: string;

  beforeAll(async () => {
    // Ensure DB connection and seeded creator are available.
    await prisma.$queryRaw`SELECT 1`;
    const creator = await prisma.user.findUnique({
      where: { email: "admin@taskmanager.local" },
      select: { id: true },
    });

    if (!creator) {
      throw new Error("Expected seeded user admin@taskmanager.local");
    }

    creatorId = creator.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/tasks returns seeded tasks", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all tasks");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/tasks validates missing title", async () => {
    const response = await request(app).post("/api/tasks").send({
      creatorId,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("title is required");
  });

  it("POST /api/tasks creates a task", async () => {
    const title = `Integration Task ${Date.now()}`;

    const response = await request(app).post("/api/tasks").send({
      title,
      creatorId,
      description: "Created by integration test",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a task");
    expect(response.body.data.title).toBe(title);
    expect(response.body.data.creatorId).toBe(creatorId);
  });

  it("GET /api/tasks/:id returns 404 for unknown task", async () => {
    const response = await request(app).get("/api/tasks/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/tasks/:id updates an existing task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({
        title: `To Update ${Date.now()}`,
        creatorId,
      });
    expect(created.status).toBe(201);

    const updatedTitle = `Updated Task ${Date.now()}`;
    const updated = await request(app)
      .put(`/api/tasks/${created.body.data.id}`)
      .send({ title: updatedTitle });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update task with ID");
    expect(updated.body.data.title).toBe(updatedTitle);
  });

  it("DELETE /api/tasks/:id deletes an existing task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({
        title: `To Delete ${Date.now()}`,
        creatorId,
      });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/tasks/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete task with ID");
  });
});
