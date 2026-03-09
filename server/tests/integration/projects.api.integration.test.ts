import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import projectsRouter from "../../routes/projects.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/projects", projectsRouter);
  return app;
};

describe("Projects API integration", () => {
  const app = buildApp();
  let creatorId: string;

  beforeAll(async () => {
    // Ensure DB connection and required seed user are available.
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

  it("GET /api/projects returns seeded projects", async () => {
    const response = await request(app).get("/api/projects");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all projects");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/projects validates missing name", async () => {
    const response = await request(app).post("/api/projects").send({
      creatorId,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Project name is required");
  });

  it("POST /api/projects creates a project", async () => {
    const title = `Integration Project ${Date.now()}`;

    const response = await request(app).post("/api/projects").send({
      name: title,
      creatorId,
      description: "Created by integration test",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a project");
    expect(response.body.data.title).toBe(title);
    expect(response.body.data.creatorId).toBe(creatorId);
  });

  it("GET /api/projects/:id returns 404 for unknown project", async () => {
    const response = await request(app).get("/api/projects/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/projects/:id updates an existing project", async () => {
    const created = await request(app)
      .post("/api/projects")
      .send({
        name: `To Update ${Date.now()}`,
        creatorId,
      });
    expect(created.status).toBe(201);

    const updatedTitle = `Updated Project ${Date.now()}`;
    const updated = await request(app)
      .put(`/api/projects/${created.body.data.id}`)
      .send({ name: updatedTitle });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update project with ID");
    expect(updated.body.data.title).toBe(updatedTitle);
  });

  it("DELETE /api/projects/:id deletes an existing project", async () => {
    const created = await request(app)
      .post("/api/projects")
      .send({
        name: `To Delete ${Date.now()}`,
        creatorId,
      });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/projects/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete project with ID");
  });
});
