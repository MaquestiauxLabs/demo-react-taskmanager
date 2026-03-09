import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
  mockIsPrismaNotFoundError,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      comment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
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

import commentsRouter from "../comments.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api", commentsRouter);
  return app;
};

describe("Comments API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/tasks/:taskId/comments returns 404 when task is missing", async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/tasks/missing/comments");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task with ID missing not found");
  });

  it("GET /api/tasks/:taskId/comments returns list of comments", async () => {
    const comments = [{ id: "c1", content: "hello" }];
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.comment.findMany.mockResolvedValueOnce(comments);

    const response = await request(buildApp()).get("/api/tasks/t1/comments");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List comments for task t1");
    expect(response.body.data).toEqual(comments);
  });

  it("GET /api/projects/:projectId/comments returns 404 when project is missing", async () => {
    mockPrisma.project.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get(
      "/api/projects/missing/comments",
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Project with ID missing not found");
  });

  it("GET /api/projects/:projectId/comments returns list of comments", async () => {
    const comments = [{ id: "c1", content: "hello" }];
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.comment.findMany.mockResolvedValueOnce(comments);

    const response = await request(buildApp()).get("/api/projects/p1/comments");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List comments for project p1");
    expect(response.body.data).toEqual(comments);
  });

  it("POST /api/comments validates exactly one target (neither)", async () => {
    const response = await request(buildApp())
      .post("/api/comments")
      .send({ content: "hello", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Exactly one target is required: taskId or projectId",
    );
  });

  it("POST /api/comments validates exactly one target (both)", async () => {
    const response = await request(buildApp()).post("/api/comments").send({
      content: "hello",
      creatorId: "u1",
      taskId: "t1",
      projectId: "p1",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Exactly one target is required: taskId or projectId",
    );
  });

  it("POST /api/comments creates a task comment", async () => {
    const created = { id: "c1", content: "hello", creatorId: "u1" };
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.task.findUnique.mockResolvedValueOnce({ id: "t1" });
    mockPrisma.comment.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/comments").send({
      content: "hello",
      creatorId: "u1",
      taskId: "t1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a comment");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/comments/:id returns 404 when comment is missing", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/comments/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Comment with ID missing not found");
  });

  it("PUT /api/comments/:id validates creatorId is required", async () => {
    const response = await request(buildApp())
      .put("/api/comments/c1")
      .send({ content: "updated" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("creatorId is required");
  });

  it("PUT /api/comments/:id returns 404 when comment is missing", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp())
      .put("/api/comments/missing")
      .send({ creatorId: "u1", content: "updated" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Comment with ID missing not found");
  });

  it("DELETE /api/comments/:id returns 404 when comment is missing", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/comments/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Comment with ID missing not found");
  });

  it("DELETE /api/comments/:id deletes comment", async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce({ id: "c1" });
    mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
      const tx = {
        commentTask: { deleteMany: vi.fn().mockResolvedValue({}) },
        commentProject: { deleteMany: vi.fn().mockResolvedValue({}) },
        comment: { delete: vi.fn().mockResolvedValue({ id: "c1" }) },
      };
      return callback(tx);
    });

    const response = await request(buildApp()).delete("/api/comments/c1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete comment with ID: c1");
  });
});
