import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import commentsRouter from "../../../routes/comments.routes";
import tasksRouter from "../../../routes/tasks.routes";
import projectsRouter from "../../../routes/projects.routes";
import {
  createTestUser,
  createTestTask,
  createTestProject,
  createTestComment,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Comments Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api", commentsRouter);
    app.use("/api/tasks", tasksRouter);
    app.use("/api/projects", projectsRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/tasks/:taskId/comments", () => {
    it("should return comments for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestComment({ taskId: task.id, creatorId: user.id });
      await createTestComment({ taskId: task.id, creatorId: user.id });

      const response = await request(app).get(`/api/tasks/${task.id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 404 when task not found", async () => {
      const response = await request(app).get(
        "/api/tasks/nonexistent-task-id/comments",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when no comments exist", async () => {
      const task = await createTestTask();

      const response = await request(app).get(`/api/tasks/${task.id}/comments`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("No comments found");
    });
  });

  describe("GET /api/projects/:projectId/comments", () => {
    it("should return comments for a project", async () => {
      const project = await createTestProject();
      const user = await createTestUser();
      await createTestComment({ projectId: project.id, creatorId: user.id });
      await createTestComment({ projectId: project.id, creatorId: user.id });

      const response = await request(app).get(
        `/api/projects/${project.id}/comments`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 404 when project not found", async () => {
      const response = await request(app).get(
        "/api/projects/nonexistent-project-id/comments",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("POST /api/comments", () => {
    it("should create a comment for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const response = await request(app).post("/api/comments").send({
        content: "Test comment",
        taskId: task.id,
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a comment");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.content).toBe("Test comment");
    });

    it("should create a comment for a project", async () => {
      const project = await createTestProject();
      const user = await createTestUser();

      const response = await request(app).post("/api/comments").send({
        content: "Test comment",
        projectId: project.id,
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("id");
    });

    it("should return 400 when content is missing", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const response = await request(app).post("/api/comments").send({
        taskId: task.id,
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("content is required");
    });

    it("should return 400 when both taskId and projectId provided", async () => {
      const task = await createTestTask();
      const project = await createTestProject();
      const user = await createTestUser();

      const response = await request(app).post("/api/comments").send({
        content: "Test comment",
        taskId: task.id,
        projectId: project.id,
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Exactly one target is required: taskId or projectId",
      );
    });

    it("should return 404 when task not found", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/comments").send({
        content: "Test comment",
        taskId: "nonexistent-task-id",
        creatorId: user.id,
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/comments/:id", () => {
    it("should return comment by ID", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/comments/${comment.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(comment.id);
    });

    it("should return 404 when comment not found", async () => {
      const response = await request(app).get("/api/comments/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/comments/:id", () => {
    it("should update comment", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/comments/${comment.id}`)
        .send({
          content: "Updated content",
          creatorId: user.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBe("Updated content");
    });

    it("should return 404 when comment not found", async () => {
      const user = await createTestUser();

      const response = await request(app)
        .put("/api/comments/nonexistent-id")
        .send({
          content: "Updated content",
          creatorId: user.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when creatorId is missing", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/comments/${comment.id}`)
        .send({
          content: "Updated content",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("creatorId is required");
    });
  });

  describe("DELETE /api/comments/:id", () => {
    it("should delete comment", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const response = await request(app).delete(`/api/comments/${comment.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("Delete comment");

      const deleted = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when comment not found", async () => {
      const response = await request(app).delete(
        "/api/comments/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
