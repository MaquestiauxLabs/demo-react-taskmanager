import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
  mockIsPrismaNotFoundError,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      task: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      priority: {
        findUnique: vi.fn(),
      },
      status: {
        findUnique: vi.fn(),
      },
      project: {
        findUnique: vi.fn(),
      },
      label: {
        findMany: vi.fn(),
      },
      taskLabel: {
        findMany: vi.fn(),
      },
    },
    mockIsPrismaConflictError: vi.fn(() => false),
    mockIsPrismaForeignKeyError: vi.fn(() => false),
    mockIsPrismaNotFoundError: vi.fn(() => false),
  };
});

vi.mock("../../utils", () => ({
  prisma: mockPrisma,
  standardiseResponse: ({
    message,
    httpStatus,
    data,
    error,
    pagination,
    sorting,
  }: {
    message: string;
    httpStatus: number;
    data?: unknown;
    error?: unknown;
    pagination?: unknown;
    sorting?: unknown;
  }) => ({
    message,
    httpStatus,
    data,
    error,
    pagination,
    sorting,
  }),
  isPrismaConflictError: mockIsPrismaConflictError,
  isPrismaForeignKeyError: mockIsPrismaForeignKeyError,
  isPrismaNotFoundError: mockIsPrismaNotFoundError,
  normalizeTaskWithDetails: <T>(entity: T) => entity,
  normalizeManyTasksWithDetails: <T>(entities: T[]) => entities,
}));

import { TasksService } from "../tasks.service";

describe("TasksService", () => {
  let service: TasksService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TasksService();
  });

  it("returns 404 when no tasks are found", async () => {
    mockPrisma.task.findMany.mockResolvedValueOnce([]);

    const result = await service.get();

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("No tasks found");
  });

  it("returns 400 when create payload is missing title", async () => {
    const result = await service.create({ creatorId: "u1" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("title is required");
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it("returns 400 when create payload is missing creatorId", async () => {
    const result = await service.create({ title: "Task A" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("creatorId is required");
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator is not found during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      title: "Task A",
      creatorId: "missing-user",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it("creates a task when payload is valid", async () => {
    const created = {
      id: "t1",
      title: "Task A",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.create.mockResolvedValueOnce(created);

    const result = await service.create({
      title: "Task A",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a task");
    expect(result.data).toEqual(created);
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: {
        title: "Task A",
        creatorId: "u1",
      },
      include: expect.any(Object),
    });
  });

  it("returns 400 when update payload has no fields", async () => {
    const result = await service.update("t1", {});

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "At least one field is required to update a task",
    );
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update target does not exist", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-task", { title: "Updated" });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Task with ID missing-task not found");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 400 when update title is empty", async () => {
    const result = await service.update("t1", { title: "  " });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("title cannot be empty");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-task");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Task with ID missing-task not found");
    expect(mockPrisma.task.delete).not.toHaveBeenCalled();
  });

  it("returns 400 when addLabels receives an empty array", async () => {
    const result = await service.addLabels("t1", []);

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("labelIds must be a non-empty array");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 404 when addLabels references unknown labels", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.label.findMany.mockResolvedValueOnce([{ id: "l1" }]);

    const result = await service.addLabels("t1", ["l1", "l2"]);

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Labels not found: l2");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("adds labels with deduplicated ids", async () => {
    const updated = { id: "t1", labelLinks: [] };

    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.label.findMany.mockResolvedValueOnce([
      { id: "l1" },
      { id: "l2" },
    ]);
    mockPrisma.taskLabel.findMany.mockResolvedValueOnce([]);
    mockPrisma.task.update.mockResolvedValueOnce(updated);

    const result = await service.addLabels("t1", ["l1", "l1", "l2"]);

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Add labels to task t1");
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: {
        labelLinks: {
          create: [
            { label: { connect: { id: "l1" } } },
            { label: { connect: { id: "l2" } } },
          ],
        },
      },
      include: expect.any(Object),
    });
  });

  it("returns 400 when setPriority is called without priorityId", async () => {
    const result = await service.setPriority(
      "t1",
      undefined as unknown as string | null,
    );

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("priorityId is required");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 404 when setPriority references unknown priority", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const result = await service.setPriority("t1", "p-missing");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Priority with ID p-missing not found");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 400 when assignProject is called without projectId", async () => {
    const result = await service.assignProject("t1", "   ");

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("projectId is required");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 400 when assignUser is called without userId", async () => {
    const result = await service.assignUser("t1", " ");

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("userId is required");
    expect(mockPrisma.task.update).not.toHaveBeenCalled();
  });

  it("returns 409 when watchTask tries to add an existing watcher", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.update.mockRejectedValueOnce(new Error("duplicate"));
    mockIsPrismaConflictError.mockReturnValueOnce(true);

    const result = await service.watchTask("t1", "u1");

    expect(result.httpStatus).toBe(409);
    expect(result.message).toBe("User u1 is already watching task t1");
  });
});
