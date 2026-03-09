import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import usersRouter from "../../routes/users.routes";
import { prisma } from "../../utils";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", usersRouter);
  return app;
};

describe("Users API integration", () => {
  const app = buildApp();

  beforeAll(async () => {
    // Ensure DB connection is valid early so failures are explicit.
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/users returns seeded users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all users");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/users creates a user", async () => {
    const email = `integration-${Date.now()}@example.com`;

    const response = await request(app).post("/api/users").send({
      name: "Integration User",
      email,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a user");
    expect(response.body.data.email).toBe(email);
    expect(response.body.data.givenName).toBe("Integration");
    expect(response.body.data.familyName).toBe("User");
  });

  it("POST /api/users returns 409 for duplicate email", async () => {
    const email = `dup-${Date.now()}@example.com`;

    const first = await request(app).post("/api/users").send({
      name: "Duplicate User",
      email,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/users").send({
      name: "Duplicate User",
      email,
    });

    expect(second.status).toBe(409);
    expect(second.body.message).toBe("User with this email already exists");
  });

  it("GET /api/users/:id returns 404 for unknown user", async () => {
    const response = await request(app).get("/api/users/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("not found");
  });

  it("PUT /api/users/:id updates an existing user", async () => {
    const email = `update-${Date.now()}@example.com`;
    const created = await request(app).post("/api/users").send({
      name: "To Update",
      email,
    });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/users/${created.body.data.id}`)
      .send({ name: "Updated Person" });

    expect(updated.status).toBe(200);
    expect(updated.body.message).toContain("Update user with ID");
    expect(updated.body.data.givenName).toBe("Updated");
    expect(updated.body.data.familyName).toBe("Person");
  });

  it("DELETE /api/users/:id deletes an existing user", async () => {
    const email = `delete-${Date.now()}@example.com`;
    const created = await request(app).post("/api/users").send({
      name: "To Delete",
      email,
    });
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(
      `/api/users/${created.body.data.id}`,
    );

    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toContain("Delete user with ID");
  });
});
