import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockIsPrismaConflictError, mockIsPrismaForeignKeyError } =
  vi.hoisted(() => {
    return {
      mockPrisma: {
        priority: {
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

import prioritiesRouter from "../priorities.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/priorities", prioritiesRouter);
  return app;
};

describe("Priorities API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/priorities returns 404 when no priorities exist", async () => {
    mockPrisma.priority.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/priorities");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No priorities found");
  });

  it("GET /api/priorities returns list of priorities", async () => {
    const priorities = [{ id: "p1", name: "High", color: "#ff0000" }];
    mockPrisma.priority.findMany.mockResolvedValueOnce(priorities);

    const response = await request(buildApp()).get("/api/priorities");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all priorities");
    expect(response.body.data).toEqual(priorities);
  });

  it("POST /api/priorities validates missing name", async () => {
    const response = await request(buildApp())
      .post("/api/priorities")
      .send({ color: "#00ff00", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/priorities validates invalid color", async () => {
    const response = await request(buildApp())
      .post("/api/priorities")
      .send({ name: "High", color: "red", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("POST /api/priorities creates a priority", async () => {
    const created = {
      id: "p1",
      name: "High",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.priority.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/priorities").send({
      name: "High",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a priority");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/priorities/:id returns 404 when priority is missing", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/priorities/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Priority with ID missing not found");
  });

  it("GET /api/priorities/:id returns a priority", async () => {
    const priority = { id: "p1", name: "High", color: "#ff0000" };
    mockPrisma.priority.findUnique.mockResolvedValueOnce(priority);

    const response = await request(buildApp()).get("/api/priorities/p1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Get priority by ID: p1");
    expect(response.body.data).toEqual(priority);
  });

  it("PUT /api/priorities/:id validates empty update payload", async () => {
    const response = await request(buildApp())
      .put("/api/priorities/p1")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "At least one field is required to update a priority",
    );
  });

  it("PUT /api/priorities/:id validates invalid color", async () => {
    const response = await request(buildApp())
      .put("/api/priorities/p1")
      .send({ color: "blue" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("PUT /api/priorities/:id updates an existing priority", async () => {
    const updated = { id: "p1", name: "Low", color: "#0000ff" };
    mockPrisma.priority.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.priority.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/priorities/p1")
      .send({ name: "Low", color: "#0000ff" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update priority with ID: p1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/priorities/:id returns 404 when priority is missing", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete(
      "/api/priorities/missing",
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Priority with ID missing not found");
  });

  it("DELETE /api/priorities/:id deletes a priority", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.priority.delete.mockResolvedValueOnce({ id: "p1" });

    const response = await request(buildApp()).delete("/api/priorities/p1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete priority with ID: p1");
  });
});
