import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockTx,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
  mockIsPrismaNotFoundError,
} = vi.hoisted(() => {
  const tx = {
    comment: {
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    commentTask: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    commentProject: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      comment: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      task: {
        findUnique: vi.fn(),
      },
      project: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
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
}));

import { CommentsService } from "../../services/comments.service";

describe("CommentsService", () => {
  let service: CommentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockTx);
    });
    service = new CommentsService();
  });

  it("returns 404 when task does not exist in getByTaskId", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const result = await service.getByTaskId("missing-task");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Task with ID missing-task not found");
  });

  it("returns 400 when create payload has no content", async () => {
    const result = await service.create({
      creatorId: "u1",
      taskId: "t1",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("content is required");
    expect(mockPrisma.comment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when create payload has both taskId and projectId", async () => {
    const result = await service.create({
      content: "hello",
      creatorId: "u1",
      taskId: "t1",
      projectId: "p1",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "Exactly one target is required: taskId or projectId",
    );
    expect(mockPrisma.comment.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator does not exist during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      content: "hello",
      creatorId: "missing-user",
      taskId: "t1",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.comment.create).not.toHaveBeenCalled();
  });

  it("creates a task comment for valid payload", async () => {
    const created = { id: "c1", content: "hello" };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.comment.create.mockResolvedValueOnce(created);

    const result = await service.create({
      content: " hello ",
      creatorId: "u1",
      taskId: "t1",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a comment");
    expect(result.data).toEqual(created);
    expect(mockPrisma.comment.create).toHaveBeenCalledWith({
      data: {
        content: "hello",
        creatorId: "u1",
        taskLinks: {
          create: {
            task: {
              connect: {
                id: "t1",
              },
            },
          },
        },
      },
      include: expect.any(Object),
    });
  });

  it("maps Prisma foreign-key error to 400 during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.comment.create.mockRejectedValueOnce(new Error("fk"));
    mockIsPrismaForeignKeyError.mockReturnValueOnce(true);

    const result = await service.create({
      content: "hello",
      creatorId: "u1",
      taskId: "t1",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("Invalid reference while creating comment");
  });

  it("returns 400 when update payload is missing creatorId", async () => {
    const result = await service.update("c1", { content: "updated" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("creatorId is required");
  });

  it("returns 404 when update target comment does not exist", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-comment", {
      creatorId: "u1",
      content: "updated",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Comment with ID missing-comment not found");
  });

  it("returns 400 when update payload has both taskId and projectId", async () => {
    const result = await service.update("c1", {
      creatorId: "u1",
      taskId: "t1",
      projectId: "p1",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "Exactly one target is required: taskId or projectId",
    );
  });

  it("updates comment and rewires links through transaction", async () => {
    const existing = {
      id: "c1",
      taskLinks: [{ taskId: "t1" }],
      projectLinks: [],
    };
    const updated = {
      id: "c1",
      content: "updated",
    };

    mockPrisma.comment.findUnique.mockResolvedValueOnce(existing);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });

    mockTx.comment.update.mockResolvedValueOnce(undefined);
    mockTx.commentProject.create.mockResolvedValueOnce(undefined);
    mockTx.comment.findUnique.mockResolvedValueOnce(updated);

    const result = await service.update("c1", {
      creatorId: "u1",
      content: "updated",
      projectId: "p1",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Update comment with ID: c1");
    expect(result.data).toEqual(updated);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("maps Prisma conflict error to 409 during update", async () => {
    const existing = {
      id: "c1",
      taskLinks: [{ taskId: "t1" }],
      projectLinks: [],
    };

    mockPrisma.comment.findUnique.mockResolvedValueOnce(existing);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.$transaction.mockRejectedValueOnce(new Error("conflict"));
    mockIsPrismaConflictError.mockReturnValueOnce(true);

    const result = await service.update("c1", {
      creatorId: "u1",
      content: "updated",
    });

    expect(result.httpStatus).toBe(409);
    expect(result.message).toBe("Comment already exists");
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-comment");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Comment with ID missing-comment not found");
  });

  it("deletes comment and linked relations", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce({ id: "c1" });
    mockTx.commentTask.deleteMany.mockResolvedValueOnce(undefined);
    mockTx.commentProject.deleteMany.mockResolvedValueOnce(undefined);
    mockTx.comment.delete.mockResolvedValueOnce(undefined);

    const result = await service.delete("c1");

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Delete comment with ID: c1");
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
