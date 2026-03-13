import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import rolesRouter from "../../../routes/roles.routes";
import {
  createTestUser,
  createTestRole,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Roles Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/roles", rolesRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/roles", () => {
    it("should return 404 when no roles exist", async () => {
      const response = await request(app).get("/api/roles");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No roles found");
    });

    it("should return all roles", async () => {
      const user = await createTestUser();
      await createTestRole({ name: "Role1", creatorId: user.id });
      await createTestRole({ name: "Role2", creatorId: user.id });

      const response = await request(app).get("/api/roles");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all roles");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/roles", () => {
    it("should create a role", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/roles").send({
        name: "Admin",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a role");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("Admin");
    });

    it("should return 400 when name is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/roles").send({
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name is required");
    });

    it("should return 400 when color is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/roles").send({
        name: "Admin",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("color is required");
    });

    it("should return 409 when role already exists", async () => {
      const user = await createTestUser();
      await createTestRole({ name: "Admin", creatorId: user.id });

      const response = await request(app).post("/api/roles").send({
        name: "Admin",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Role already exists");
    });
  });

  describe("GET /api/roles/:id", () => {
    it("should return role by ID", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const response = await request(app).get(`/api/roles/${role.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(role.id);
      expect(response.body.data.name).toBe("Admin");
    });

    it("should return 404 when role not found", async () => {
      const response = await request(app).get("/api/roles/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/roles/:id", () => {
    it("should update role", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const response = await request(app).put(`/api/roles/${role.id}`).send({
        name: "SuperAdmin",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("SuperAdmin");
    });

    it("should return 404 when role not found", async () => {
      const response = await request(app)
        .put("/api/roles/nonexistent-id")
        .send({
          name: "Admin",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const response = await request(app).put(`/api/roles/${role.id}`).send({
        name: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name cannot be empty");
    });
  });

  describe("DELETE /api/roles/:id", () => {
    it("should delete role", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const response = await request(app).delete(`/api/roles/${role.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(role.id);

      const deleted = await prisma.role.findUnique({ where: { id: role.id } });
      expect(deleted).toBeNull();
    });

    it("should return 404 when role not found", async () => {
      const response = await request(app).delete("/api/roles/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
