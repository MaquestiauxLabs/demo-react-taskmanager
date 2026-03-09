import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import labelsRouter from "../../routes/labels.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/labels", labelsRouter);
  return app;
};

describe("Labels API integration", () => {
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

  it("GET /api/labels returns seeded labels", async () => {
    const response = await request(app).get("/api/labels");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all labels");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/labels validates missing name", async () => {
    const response = await request(app).post("/api/labels").send({
      color: "#112233",
      creatorId,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/labels creates a label", async () => {
    const name = `IntegrationLabel${Date.now()}`;

    const response = await request(app).post("/api/labels").send({
      name,
      color: "#112233",
      creatorId,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a label");
    expect(response.body.data.name).toBe(name);
    expect(response.body.data.creatorId).toBe(creatorId);
  });

  it("POST /api/labels returns 404 when creator does not exist", async () => {
    const response = await request(app)
      .post("/api/labels")
      .send({
        name: `NoCreator${Date.now()}`,
        color: "#123456",
        creatorId: "missing-user-id",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("GET /api/labels/:id returns 404 for unknown label", async () => {
    const response = await request(app).get("/api/labels/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/labels/:id updates an existing label", async () => {
    const created = await request(app)
      .post("/api/labels")
      .send({
        name: `ToUpdate${Date.now()}`,
        color: "#abcdef",
        creatorId,
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/labels/${created.body.data.id}`)
      .send({ name: `Updated${Date.now()}`, color: "#00aa00" });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update label with ID");
    expect(updated.body.data.color).toBe("#00aa00");
  });

  it("DELETE /api/labels/:id deletes an existing label", async () => {
    const created = await request(app)
      .post("/api/labels")
      .send({
        name: `ToDelete${Date.now()}`,
        color: "#aabbcc",
        creatorId,
      });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/labels/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete label with ID");
  });
});
