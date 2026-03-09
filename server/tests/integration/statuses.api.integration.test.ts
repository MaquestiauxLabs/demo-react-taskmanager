import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import statusesRouter from "../../routes/statuses.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/statuses", statusesRouter);
  return app;
};

describe("Statuses API integration", () => {
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

  it("GET /api/statuses returns seeded statuses", async () => {
    const response = await request(app).get("/api/statuses");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all statuses");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/statuses validates missing name", async () => {
    const response = await request(app).post("/api/statuses").send({
      color: "#112233",
      creatorId,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/statuses creates a status", async () => {
    const name = `IntegrationStatus${Date.now()}`;

    const response = await request(app).post("/api/statuses").send({
      name,
      color: "#112233",
      creatorId,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a status");
    expect(response.body.data.name).toBe(name);
    expect(response.body.data.creatorId).toBe(creatorId);
  });

  it("POST /api/statuses returns 404 when creator does not exist", async () => {
    const response = await request(app)
      .post("/api/statuses")
      .send({
        name: `NoCreator${Date.now()}`,
        color: "#123456",
        creatorId: "missing-user-id",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("GET /api/statuses/:id returns 404 for unknown status", async () => {
    const response = await request(app).get("/api/statuses/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/statuses/:id updates an existing status", async () => {
    const created = await request(app)
      .post("/api/statuses")
      .send({
        name: `ToUpdate${Date.now()}`,
        color: "#abcdef",
        creatorId,
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/statuses/${created.body.data.id}`)
      .send({ name: `Updated${Date.now()}`, color: "#00aa00" });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update status with ID");
    expect(updated.body.data.color).toBe("#00aa00");
  });

  it("DELETE /api/statuses/:id deletes an existing status", async () => {
    const created = await request(app)
      .post("/api/statuses")
      .send({
        name: `ToDelete${Date.now()}`,
        color: "#aabbcc",
        creatorId,
      });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/statuses/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete status with ID");
  });
});
