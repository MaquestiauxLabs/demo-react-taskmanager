import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import prioritiesRouter from "../../../routes/priorities.routes";
import {
  createTestUser,
  createTestPriority,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Priorities Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/priorities", prioritiesRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/priorities", () => {
    it("should return 404 when no priorities exist", async () => {
      const response = await request(app).get("/api/priorities");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No priorities found");
    });

    it("should return all priorities", async () => {
      const user = await createTestUser();
      await createTestPriority({ name: "Priority1", creatorId: user.id });
      await createTestPriority({ name: "Priority2", creatorId: user.id });

      const response = await request(app).get("/api/priorities");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all priorities");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/priorities", () => {
    it("should create a priority", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/priorities").send({
        name: "High",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a priority");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("High");
    });

    it("should return 400 when name is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/priorities").send({
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name is required");
    });

    it("should return 400 when color is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/priorities").send({
        name: "High",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("color is required");
    });

    it("should return 409 when priority already exists", async () => {
      const user = await createTestUser();
      await createTestPriority({ name: "High", creatorId: user.id });

      const response = await request(app).post("/api/priorities").send({
        name: "High",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Priority already exists");
    });
  });

  describe("GET /api/priorities/:id", () => {
    it("should return priority by ID", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/priorities/${priority.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(priority.id);
      expect(response.body.data.name).toBe("High");
    });

    it("should return 404 when priority not found", async () => {
      const response = await request(app).get("/api/priorities/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/priorities/:id", () => {
    it("should update priority", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/priorities/${priority.id}`)
        .send({
          name: "Critical",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Critical");
    });

    it("should return 404 when priority not found", async () => {
      const response = await request(app)
        .put("/api/priorities/nonexistent-id")
        .send({
          name: "High",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/priorities/${priority.id}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name cannot be empty");
    });
  });

  describe("DELETE /api/priorities/:id", () => {
    it("should delete priority", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const response = await request(app).delete(
        `/api/priorities/${priority.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(priority.id);

      const deleted = await prisma.priority.findUnique({
        where: { id: priority.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when priority not found", async () => {
      const response = await request(app).delete(
        "/api/priorities/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
