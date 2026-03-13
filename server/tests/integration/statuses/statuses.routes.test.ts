import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import statusesRouter from "../../../routes/statuses.routes";
import {
  createTestUser,
  createTestStatus,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Statuses Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/statuses", statusesRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/statuses", () => {
    it("should return 404 when no statuses exist", async () => {
      const response = await request(app).get("/api/statuses");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No statuses found");
    });

    it("should return all statuses", async () => {
      const user = await createTestUser();
      await createTestStatus({ name: "Status1", creatorId: user.id });
      await createTestStatus({ name: "Status2", creatorId: user.id });

      const response = await request(app).get("/api/statuses");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all statuses");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/statuses", () => {
    it("should create a status", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/statuses").send({
        name: "ToDo",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a status");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("ToDo");
    });

    it("should return 400 when name is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/statuses").send({
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name is required");
    });

    it("should return 400 when color is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/statuses").send({
        name: "ToDo",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("color is required");
    });

    it("should return 409 when status already exists", async () => {
      const user = await createTestUser();
      await createTestStatus({ name: "ToDo", creatorId: user.id });

      const response = await request(app).post("/api/statuses").send({
        name: "ToDo",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Status already exists");
    });
  });

  describe("GET /api/statuses/:id", () => {
    it("should return status by ID", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/statuses/${status.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(status.id);
      expect(response.body.data.name).toBe("ToDo");
    });

    it("should return 404 when status not found", async () => {
      const response = await request(app).get("/api/statuses/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/statuses/:id", () => {
    it("should update status", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/statuses/${status.id}`)
        .send({
          name: "InProgress",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("InProgress");
    });

    it("should return 404 when status not found", async () => {
      const response = await request(app)
        .put("/api/statuses/nonexistent-id")
        .send({
          name: "ToDo",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/statuses/${status.id}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name cannot be empty");
    });
  });

  describe("DELETE /api/statuses/:id", () => {
    it("should delete status", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const response = await request(app).delete(`/api/statuses/${status.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(status.id);

      const deleted = await prisma.status.findUnique({
        where: { id: status.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when status not found", async () => {
      const response = await request(app).delete(
        "/api/statuses/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
