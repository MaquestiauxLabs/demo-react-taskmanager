import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import labelsRouter from "../../../routes/labels.routes";
import {
  createTestUser,
  createTestLabel,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Labels Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/labels", labelsRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/labels", () => {
    it("should return 404 when no labels exist", async () => {
      const response = await request(app).get("/api/labels");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No labels found");
    });

    it("should return all labels", async () => {
      const user = await createTestUser();
      await createTestLabel({
        name: "Label1",
        color: "#FF0000",
        creatorId: user.id,
      });
      await createTestLabel({
        name: "Label2",
        color: "#00FF00",
        creatorId: user.id,
      });

      const response = await request(app).get("/api/labels");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all labels");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/labels", () => {
    it("should create a label", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/labels").send({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a label");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("Bug");
    });

    it("should return 400 when name is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/labels").send({
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name is required");
    });

    it("should return 400 when color is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/labels").send({
        name: "Bug",
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("color is required");
    });

    it("should return 409 when label already exists", async () => {
      const user = await createTestUser();
      await createTestLabel({
        name: "Bug",
        color: "#FF0000",
        creatorId: user.id,
      });

      const response = await request(app).post("/api/labels").send({
        name: "Bug",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Label already exists");
    });
  });

  describe("GET /api/labels/:id", () => {
    it("should return label by ID", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/labels/${label.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(label.id);
      expect(response.body.data.name).toBe("Bug");
    });

    it("should return 404 when label not found", async () => {
      const response = await request(app).get("/api/labels/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/labels/:id", () => {
    it("should update label", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const response = await request(app).put(`/api/labels/${label.id}`).send({
        name: "Feature",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Feature");
    });

    it("should return 404 when label not found", async () => {
      const response = await request(app)
        .put("/api/labels/nonexistent-id")
        .send({
          name: "Bug",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const response = await request(app).put(`/api/labels/${label.id}`).send({
        name: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("name cannot be empty");
    });
  });

  describe("DELETE /api/labels/:id", () => {
    it("should delete label", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const response = await request(app).delete(`/api/labels/${label.id}`);

      expect(response.status).toBe(200);

      const deleted = await prisma.label.findUnique({
        where: { id: label.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when label not found", async () => {
      const response = await request(app).delete("/api/labels/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
