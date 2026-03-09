import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import commentsRouter from "../../routes/comments.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api", commentsRouter);
  return app;
};

describe("Comments API integration", () => {
  const app = buildApp();
  let creatorId: string;
  let taskId: string;
  let projectId: string;

  beforeAll(async () => {
    // Ensure DB connection and required seeded entities are available.
    await prisma.$queryRaw`SELECT 1`;

    const creator = await prisma.user.findUnique({
      where: { email: "admin@taskmanager.local" },
      select: { id: true },
    });
    const task = await prisma.task.findFirst({ select: { id: true } });
    const project = await prisma.project.findFirst({ select: { id: true } });

    if (!creator || !task || !project) {
      throw new Error("Expected seeded creator, task, and project");
    }

    creatorId = creator.id;
    taskId = task.id;
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/tasks/:taskId/comments returns comments for seeded task", async () => {
    const seedCreate = await request(app)
      .post("/api/comments")
      .send({
        content: `Task comment ${Date.now()}`,
        creatorId,
        taskId,
      });
    expect(seedCreate.status).toBe(201);

    const response = await request(app).get(`/api/tasks/${taskId}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(`List comments for task ${taskId}`);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/comments validates exactly one target", async () => {
    const response = await request(app).post("/api/comments").send({
      content: "Invalid target",
      creatorId,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Exactly one target is required: taskId or projectId",
    );
  });

  it("POST /api/comments creates a project comment", async () => {
    const response = await request(app)
      .post("/api/comments")
      .send({
        content: `Project comment ${Date.now()}`,
        creatorId,
        projectId,
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a comment");
    expect(response.body.data.creatorId).toBe(creatorId);
  });

  it("GET /api/comments/:id returns 404 for unknown comment", async () => {
    const response = await request(app).get("/api/comments/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/comments/:id updates an existing comment", async () => {
    const created = await request(app)
      .post("/api/comments")
      .send({
        content: `To update ${Date.now()}`,
        creatorId,
        taskId,
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/comments/${created.body.data.id}`)
      .send({ content: "Updated comment", creatorId });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update comment with ID");
    expect(updated.body.data.content).toBe("Updated comment");
  });

  it("DELETE /api/comments/:id deletes an existing comment", async () => {
    const created = await request(app)
      .post("/api/comments")
      .send({
        content: `To delete ${Date.now()}`,
        creatorId,
        projectId,
      });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/comments/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete comment with ID");
  });
});
