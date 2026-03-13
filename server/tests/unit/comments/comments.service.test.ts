import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { CommentsService } from "../../../services/comments.service";
import {
  createTestComment,
  createTestTask,
  createTestProject,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("CommentsService", () => {
  let service: CommentsService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new CommentsService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getByTaskId", () => {
    it("should return comments for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestComment({ taskId: task.id, creatorId: user.id });
      await createTestComment({ taskId: task.id, creatorId: user.id });

      const result = await service.getByTaskId(task.id);

      expect(result.httpStatus).toBe(200);
      expect(result.message).toContain("List comments for task");
      expect(result.data).toHaveLength(2);
    });

    it("should return 400 when taskId is empty", async () => {
      const result = await service.getByTaskId("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("taskId is required");
    });

    it("should return 404 when task not found", async () => {
      const result = await service.getByTaskId("nonexistent-task-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when no comments exist", async () => {
      const task = await createTestTask();

      const result = await service.getByTaskId(task.id);

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("No comments found");
    });
  });

  describe("getByProjectId", () => {
    it("should return comments for a project", async () => {
      const project = await createTestProject();
      const user = await createTestUser();
      await createTestComment({ projectId: project.id, creatorId: user.id });
      await createTestComment({ projectId: project.id, creatorId: user.id });

      const result = await service.getByProjectId(project.id);

      expect(result.httpStatus).toBe(200);
      expect(result.message).toContain("List comments for project");
      expect(result.data).toHaveLength(2);
    });

    it("should return 400 when projectId is empty", async () => {
      const result = await service.getByProjectId("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("projectId is required");
    });

    it("should return 404 when project not found", async () => {
      const result = await service.getByProjectId("nonexistent-project-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("create", () => {
    it("should create a comment for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        taskId: task.id,
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a comment");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.content).toBe("Test comment");
    });

    it("should create a comment for a project", async () => {
      const project = await createTestProject();
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        projectId: project.id,
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a comment");
      expect(result.data).toHaveProperty("id");
    });

    it("should return 400 when content is missing", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const result = await service.create({
        taskId: task.id,
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("content is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const task = await createTestTask();

      const result = await service.create({
        content: "Test comment",
        taskId: task.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 400 when both taskId and projectId provided", async () => {
      const task = await createTestTask();
      const project = await createTestProject();
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        taskId: task.id,
        projectId: project.id,
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "Exactly one target is required: taskId or projectId",
      );
    });

    it("should return 400 when neither taskId nor projectId provided", async () => {
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "Exactly one target is required: taskId or projectId",
      );
    });

    it("should return 404 when task not found", async () => {
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        taskId: "nonexistent-task-id",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when project not found", async () => {
      const user = await createTestUser();

      const result = await service.create({
        content: "Test comment",
        projectId: "nonexistent-project-id",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creator not found", async () => {
      const task = await createTestTask();

      const result = await service.create({
        content: "Test comment",
        taskId: task.id,
        creatorId: "nonexistent-user-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("getById", () => {
    it("should return comment by ID", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.getById(comment.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(comment.id);
      expect(result.data!.content).toBeDefined();
    });

    it("should return 400 when id is empty", async () => {
      const result = await service.getById("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("id is required");
    });

    it("should return 404 when comment not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update comment content", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.update(comment.id, {
        content: "Updated content",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.content).toBe("Updated content");
    });

    it("should return 400 when id is empty", async () => {
      const user = await createTestUser();

      const result = await service.update("", {
        content: "Updated content",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("id is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.update(comment.id, {
        content: "Updated content",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 400 when content is empty string", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.update(comment.id, {
        content: "",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("content cannot be empty");
    });

    it("should return 404 when comment not found", async () => {
      const user = await createTestUser();

      const result = await service.update("nonexistent-id", {
        content: "Updated content",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creator not found", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.update(comment.id, {
        content: "Updated content",
        creatorId: "nonexistent-user-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("delete", () => {
    it("should delete comment", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const comment = await createTestComment({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.delete(comment.id);

      expect(result.httpStatus).toBe(200);

      const deleted = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 400 when id is empty", async () => {
      const result = await service.delete("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("id is required");
    });

    it("should return 404 when comment not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
