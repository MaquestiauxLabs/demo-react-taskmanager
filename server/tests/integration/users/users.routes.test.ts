import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import usersRouter from "../../../routes/users.routes";
import { createTestUser, getTestPrisma, cleanDatabase } from "../../helpers";

describe("Users Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/users", usersRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/users", () => {
    it("should return 404 when no users exist", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No users found");
    });

    it("should return all users", async () => {
      await createTestUser({
        email: "user1@test.com",
        givenName: "User",
        familyName: "One",
      });
      await createTestUser({
        email: "user2@test.com",
        givenName: "User",
        familyName: "Two",
      });

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all users");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/users", () => {
    it("should create a user", async () => {
      const response = await request(app).post("/api/users").send({
        givenName: "John",
        familyName: "Doe",
        email: "john@example.com",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a user");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.email).toBe("john@example.com");
    });

    it("should return 400 when givenName is missing", async () => {
      const response = await request(app).post("/api/users").send({
        familyName: "Doe",
        email: "john@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User name is required");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app).post("/api/users").send({
        givenName: "John",
        familyName: "Doe",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User email is required");
    });

    it("should return 409 when email already exists", async () => {
      await createTestUser({ email: "existing@example.com" });

      const response = await request(app).post("/api/users").send({
        givenName: "John",
        familyName: "Doe",
        email: "existing@example.com",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("User with this email already exists");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user by ID", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const response = await request(app).get(`/api/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe("test@example.com");
    });

    it("should return 404 when user not found", async () => {
      const response = await request(app).get("/api/users/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const response = await request(app).put(`/api/users/${user.id}`).send({
        givenName: "Updated",
        familyName: "Name",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.givenName).toBe("Updated");
      expect(response.body.data.familyName).toBe("Name");
    });

    it("should return 404 when user not found", async () => {
      const response = await request(app)
        .put("/api/users/nonexistent-id")
        .send({
          givenName: "Updated",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when email is empty string", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const response = await request(app).put(`/api/users/${user.id}`).send({
        email: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User email cannot be empty");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const response = await request(app).delete(`/api/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);

      const deleted = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it("should return 404 when user not found", async () => {
      const response = await request(app).delete("/api/users/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
