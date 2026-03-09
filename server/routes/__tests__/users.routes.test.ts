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
      user: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
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
}));

import usersRouter from "../users.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", usersRouter);
  return app;
};

describe("Users API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/users returns 404 when no users exist", async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/users");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No users found");
  });

  it("GET /api/users returns list of users", async () => {
    const users = [{ id: "u1", name: "Alice", email: "alice@acme.com" }];
    mockPrisma.user.findMany.mockResolvedValueOnce(users);

    const response = await request(buildApp()).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all users");
    expect(response.body.data).toEqual(users);
  });

  it("POST /api/users validates missing name", async () => {
    const response = await request(buildApp())
      .post("/api/users")
      .send({ email: "alice@acme.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User name is required");
  });

  it("POST /api/users validates missing email", async () => {
    const response = await request(buildApp())
      .post("/api/users")
      .send({ name: "Alice" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User email is required");
  });

  it("POST /api/users validates unknown role", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).post("/api/users").send({
      name: "Alice",
      email: "alice@acme.com",
      roleId: "missing-role",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Role with ID missing-role not found");
  });

  it("POST /api/users creates a user", async () => {
    const created = { id: "u1", name: "Alice", email: "alice@acme.com" };
    mockPrisma.user.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/users").send({
      name: "Alice",
      email: "alice@acme.com",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a user");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/users/:id returns 404 when user is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/users/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User with ID missing not found");
  });

  it("PUT /api/users/:id validates empty name", async () => {
    const response = await request(buildApp())
      .put("/api/users/u1")
      .send({ name: "  " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User name cannot be empty");
  });

  it("PUT /api/users/:id updates a user", async () => {
    const updated = { id: "u1", name: "Alice Updated", email: "alice@acme.com" };
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.user.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/users/u1")
      .send({ name: "Alice Updated" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update user with ID: u1");
    expect(response.body.data).toEqual(updated);
  });

  it("PUT /api/users/:id handles duplicate email conflict", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockIsPrismaConflictError.mockReturnValueOnce(true);
    mockPrisma.user.update.mockRejectedValueOnce(new Error("Unique constraint"));

    const response = await request(buildApp())
      .put("/api/users/u1")
      .send({ email: "dup@acme.com" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("User with this email already exists");
  });

  it("DELETE /api/users/:id returns 404 when user is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/users/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User with ID missing not found");
  });

  it("DELETE /api/users/:id deletes a user", async () => {
    const deleted = { id: "u1", name: "Alice", email: "alice@acme.com" };
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.user.delete.mockResolvedValueOnce(deleted);

    const response = await request(buildApp()).delete("/api/users/u1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete user with ID: u1");
    expect(response.body.data).toEqual(deleted);
  });
});
