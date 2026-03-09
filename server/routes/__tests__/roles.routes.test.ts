import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockIsPrismaConflictError, mockIsPrismaForeignKeyError } =
  vi.hoisted(() => {
    return {
      mockPrisma: {
        role: {
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

import rolesRouter from "../roles.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/roles", rolesRouter);
  return app;
};

describe("Roles API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/roles returns 404 when no roles exist", async () => {
    mockPrisma.role.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/roles");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No roles found");
  });

  it("GET /api/roles returns list of roles", async () => {
    const roles = [{ id: "r1", name: "Admin", color: "#ff0000" }];
    mockPrisma.role.findMany.mockResolvedValueOnce(roles);

    const response = await request(buildApp()).get("/api/roles");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all roles");
    expect(response.body.data).toEqual(roles);
  });

  it("POST /api/roles validates missing name", async () => {
    const response = await request(buildApp())
      .post("/api/roles")
      .send({ color: "#00ff00", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/roles validates invalid color", async () => {
    const response = await request(buildApp())
      .post("/api/roles")
      .send({ name: "Admin", color: "red", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("POST /api/roles creates a role", async () => {
    const created = {
      id: "r1",
      name: "Admin",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.role.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/roles").send({
      name: "Admin",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a role");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/roles/:id returns 404 when role is missing", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/roles/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Role with ID missing not found");
  });

  it("GET /api/roles/:id returns a role", async () => {
    const role = { id: "r1", name: "Admin", color: "#ff0000" };
    mockPrisma.role.findUnique.mockResolvedValueOnce(role);

    const response = await request(buildApp()).get("/api/roles/r1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Get role by ID: r1");
    expect(response.body.data).toEqual(role);
  });

  it("PUT /api/roles/:id validates empty update payload", async () => {
    const response = await request(buildApp()).put("/api/roles/r1").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "At least one field is required to update a role",
    );
  });

  it("PUT /api/roles/:id validates invalid color", async () => {
    const response = await request(buildApp())
      .put("/api/roles/r1")
      .send({ color: "blue" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("PUT /api/roles/:id updates an existing role", async () => {
    const updated = { id: "r1", name: "Member", color: "#0000ff" };
    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockPrisma.role.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/roles/r1")
      .send({ name: "Member", color: "#0000ff" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update role with ID: r1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/roles/:id returns 404 when role is missing", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/roles/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Role with ID missing not found");
  });

  it("DELETE /api/roles/:id deletes a role", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockPrisma.role.delete.mockResolvedValueOnce({ id: "r1" });

    const response = await request(buildApp()).delete("/api/roles/r1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete role with ID: r1");
  });
});
