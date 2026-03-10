import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockIsPrismaConflictError, mockIsPrismaForeignKeyError } =
  vi.hoisted(() => {
    return {
      mockPrisma: {
        status: {
          findMany: vi.fn(),
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      },
      mockIsPrismaConflictError: vi.fn(() => false),
      mockIsPrismaForeignKeyError: vi.fn(() => false),
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
}));

import statusesRouter from "../../routes/statuses.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/statuses", statusesRouter);
  return app;
};

describe("Statuses API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/statuses returns 404 when no statuses exist", async () => {
    mockPrisma.status.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/statuses");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No statuses found");
  });

  it("GET /api/statuses returns list of statuses", async () => {
    const statuses = [{ id: "s1", name: "Todo", color: "#ff0000" }];
    mockPrisma.status.findMany.mockResolvedValueOnce(statuses);

    const response = await request(buildApp()).get("/api/statuses");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all statuses");
    expect(response.body.data).toEqual(statuses);
  });

  it("POST /api/statuses validates missing name", async () => {
    const response = await request(buildApp())
      .post("/api/statuses")
      .send({ color: "#00ff00", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/statuses validates invalid color", async () => {
    const response = await request(buildApp())
      .post("/api/statuses")
      .send({ name: "Todo", color: "red", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("POST /api/statuses creates a status", async () => {
    const created = {
      id: "s1",
      name: "Todo",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.status.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/statuses").send({
      name: "Todo",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a status");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/statuses/:id returns 404 when status is missing", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/statuses/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Status with ID missing not found");
  });

  it("GET /api/statuses/:id returns a status", async () => {
    const status = { id: "s1", name: "Todo", color: "#ff0000" };
    mockPrisma.status.findUnique.mockResolvedValueOnce(status);

    const response = await request(buildApp()).get("/api/statuses/s1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Get status by ID: s1");
    expect(response.body.data).toEqual(status);
  });

  it("PUT /api/statuses/:id validates empty update payload", async () => {
    const response = await request(buildApp()).put("/api/statuses/s1").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "At least one field is required to update a status",
    );
  });

  it("PUT /api/statuses/:id validates invalid color", async () => {
    const response = await request(buildApp())
      .put("/api/statuses/s1")
      .send({ color: "blue" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("PUT /api/statuses/:id updates an existing status", async () => {
    const updated = { id: "s1", name: "Done", color: "#0000ff" };
    mockPrisma.status.findUnique.mockResolvedValueOnce({ id: "s1" });
    mockPrisma.status.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/statuses/s1")
      .send({ name: "Done", color: "#0000ff" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update status with ID: s1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/statuses/:id returns 404 when status is missing", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/statuses/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Status with ID missing not found");
  });

  it("DELETE /api/statuses/:id deletes a status", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce({ id: "s1" });
    mockPrisma.status.delete.mockResolvedValueOnce({ id: "s1" });

    const response = await request(buildApp()).delete("/api/statuses/s1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete status with ID: s1");
  });
});
