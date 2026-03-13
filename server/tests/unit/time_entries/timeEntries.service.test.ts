import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { TimeEntriesService } from "../../../services/time_entries.service";
import {
  createTestTimeEntry,
  createTestTask,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("TimeEntriesService", () => {
  let service: TimeEntriesService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new TimeEntriesService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getByTaskId", () => {
    it("should return time entries for a task", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestTimeEntry({ taskId: task.id, creatorId: user.id });
      await createTestTimeEntry({ taskId: task.id, creatorId: user.id });

      const result = await service.getByTaskId(task.id);

      expect(result.httpStatus).toBe(200);
      expect(result.message).toContain("List time entries for task");
      expect(result.data).toHaveLength(2);
    });

    it("should return empty array when no time entries exist", async () => {
      const task = await createTestTask();

      const result = await service.getByTaskId(task.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("should return time entry by ID", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.getById(timeEntry.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(timeEntry.id);
    });

    it("should return 404 when time entry not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("create", () => {
    it("should create a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const result = await service.create(task.id, {
        startDate: new Date(),
        duration: 2,
        creator: { connect: { id: user.id } },
      } as unknown as Parameters<typeof service.create>[1]);

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create time entry");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.duration).toBe(2);
    });

    it("should return 404 when task does not exist", async () => {
      const user = await createTestUser();

      const result = await service.create("nonexistent-task-id", {
        startDate: new Date(),
        duration: 2,
        creator: { connect: { id: user.id } },
      } as unknown as Parameters<typeof service.create>[1]);

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("startTimer", () => {
    it("should start a timer", async () => {
      const task = await createTestTask();
      const user = await createTestUser();

      const result = await service.startTimer(task.id, user.id);

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Timer started");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.endDate).toBeNull();
      expect(result.data!.duration).toBe(0);
    });

    it("should return 404 when task does not exist", async () => {
      const user = await createTestUser();

      const result = await service.startTimer("nonexistent-task-id", user.id);

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when user does not exist", async () => {
      const task = await createTestTask();

      const result = await service.startTimer(task.id, "nonexistent-user-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 400 when timer already running", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: null,
      });

      const result = await service.startTimer(task.id, user.id);

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("A timer is already running for this task");
    });
  });

  describe("stopTimer", () => {
    it("should stop a timer", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: null,
      });

      const result = await service.stopTimer(timeEntry.id);

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("Timer stopped");
      expect(result.data!.endDate).not.toBeNull();
      expect(result.data!.duration).toBeGreaterThan(0);
    });

    it("should return 404 when time entry not found", async () => {
      const result = await service.stopTimer("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 400 when timer already stopped", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
        endDate: new Date(),
      });

      const result = await service.stopTimer(timeEntry.id);

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("Timer already stopped");
    });
  });

  describe("update", () => {
    it("should update a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.update(timeEntry.id, {
        duration: 5,
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.duration).toBe(5);
    });

    it("should return 404 when time entry not found", async () => {
      const result = await service.update("nonexistent-id", {
        duration: 5,
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("delete", () => {
    it("should delete a time entry", async () => {
      const task = await createTestTask();
      const user = await createTestUser();
      const timeEntry = await createTestTimeEntry({
        taskId: task.id,
        creatorId: user.id,
      });

      const result = await service.delete(timeEntry.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(timeEntry.id);

      const deleted = await prisma.timeEntry.findUnique({
        where: { id: timeEntry.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when time entry not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
