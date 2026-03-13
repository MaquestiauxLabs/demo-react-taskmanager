import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { TasksService } from "../../../services/tasks.service";
import {
  createTestTask,
  createTestUser,
  createTestStatus,
  createTestPriority,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("TasksService", () => {
  let service: TasksService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new TasksService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no tasks exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No tasks found");
    });

    it("should return all tasks", async () => {
      const user = await createTestUser();
      await createTestTask({ title: "Task1", creatorId: user.id });
      await createTestTask({ title: "Task2", creatorId: user.id });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all tasks");
      expect(result.data).toHaveLength(2);
    });

    it("should exclude archived tasks", async () => {
      const user = await createTestUser();
      await createTestTask({ title: "Active Task", creatorId: user.id });
      await prisma.task.create({
        data: {
          title: "Archived Task",
          creatorId: user.id,
          isArchived: true,
        },
      });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Active Task");
    });
  });

  describe("create", () => {
    it("should create a task with title", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a task");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.title).toBe("New Task");
    });

    it("should create a task with description", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        description: "Task description",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.data!.description).toBe("Task description");
    });

    it("should create a task with priority and status", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority();
      const status = await createTestStatus();

      const result = await service.create({
        title: "New Task",
        creatorId: user.id,
        priorityId: priority.id,
        statusId: status.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.data!.priority).toBeDefined();
      expect(result.data!.status).toBeDefined();
    });

    it("should return 400 when title is missing", async () => {
      const user = await createTestUser();

      const result = await service.create({
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("title is required");
    });

    it("should return 400 when title is empty", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("title is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        title: "New Task",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 400 when description is empty string", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        description: "",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("description cannot be empty");
    });

    it("should return 404 when parent task not found", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        parentId: "nonexistent-parent-id",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when priority not found", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        priorityId: "nonexistent-priority-id",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when status not found", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Task",
        statusId: "nonexistent-status-id",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("getById", () => {
    it("should return task by ID", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const result = await service.getById(task.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(task.id);
      expect(result.data!.title).toBe("Test Task");
    });

    it("should return 404 when task not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update task title", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Old Title",
        creatorId: user.id,
      });

      const result = await service.update(task.id, {
        title: "New Title",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.title).toBe("New Title");
    });

    it("should update task description", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const result = await service.update(task.id, {
        description: "New description",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.description).toBe("New description");
    });

    it("should update task status", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });
      const status = await createTestStatus();

      const result = await service.update(task.id, {
        statusId: status.id,
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.status).toBeDefined();
    });

    it("should return 404 when task not found", async () => {
      const result = await service.update("nonexistent-id", {
        title: "New Title",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 400 when title is empty string", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const result = await service.update(task.id, {
        title: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("title cannot be empty");
    });
  });

  describe("delete", () => {
    it("should delete task", async () => {
      const user = await createTestUser();
      const task = await createTestTask({
        title: "Test Task",
        creatorId: user.id,
      });

      const result = await service.delete(task.id);

      expect(result.httpStatus).toBe(200);

      const deleted = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when task not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
