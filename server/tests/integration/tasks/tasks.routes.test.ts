import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import tasksRouter from "../../../routes/tasks.routes";
import {
  createTestUser,
  createTestTask,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Tasks Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/tasks", tasksRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/tasks", () => {
    it("should return 404 when no tasks exist", async () => {
      const response = await request(app).get("/api/tasks");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No tasks found");
    });

    it("should return all tasks", async () => {
      const user = await createTestUser();
      await createTestTask({ title: "Task1", creatorId: user.id });
      await createTestTask({ title: "Task2", creatorId: user.id });

      const response = await request(app).get("/api/tasks");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all tasks");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/tasks", () => {
    it("should create a task", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/tasks").send({
        title: "New Task",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a task");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.title).toBe("New Task");
    });

    it("should return 400 when title is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/tasks").send({
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("title is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const response = await request(app).post("/api/tasks").send({
        title: "New Task",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("creatorId is required");
    });

    it("should return 404 when priority not found", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/tasks").send({
        title: "New Task",
        creatorId: user.id,
        priorityId: "nonexistent-priority-id",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("should return task by ID", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/tasks/${task.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.title).toBe("Test Task");
    });

    it("should return 404 when task not found", async () => {
      const response = await request(app).get("/api/tasks/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("should update task", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Old Title",
        creatorId: user.id,
      });

      const response = await request(app).put(`/api/tasks/${task.id}`).send({
        title: "New Title",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("New Title");
    });

    it("should return 404 when task not found", async () => {
      const response = await request(app)
        .put("/api/tasks/nonexistent-id")
        .send({
          title: "New Title",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when title is empty string", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const response = await request(app).put(`/api/tasks/${task.id}`).send({
        title: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("title cannot be empty");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should delete task", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const response = await request(app).delete(`/api/tasks/${task.id}`);

      expect(response.status).toBe(200);

      const deleted = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when task not found", async () => {
      const response = await request(app).delete("/api/tasks/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
