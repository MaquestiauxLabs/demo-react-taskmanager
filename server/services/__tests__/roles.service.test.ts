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

import { RolesService } from "../roles.service";

describe("RolesService", () => {
  let service: RolesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RolesService();
  });

  it("returns 404 when no roles are found", async () => {
    mockPrisma.role.findMany.mockResolvedValueOnce([]);

    const result = await service.get();

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("No roles found");
  });

  it("returns 400 when create payload is missing name", async () => {
    const result = await service.create({ color: "#00ff00", creatorId: "u1" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("name is required");
    expect(mockPrisma.role.create).not.toHaveBeenCalled();
  });

  it("returns 400 when create payload has invalid color", async () => {
    const result = await service.create({
      name: "Developer",
      color: "blue",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("color must be a valid hex code");
    expect(mockPrisma.role.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator is not found during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      name: "Developer",
      color: "#00ff00",
      creatorId: "missing-user",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.role.create).not.toHaveBeenCalled();
  });

  it("returns 409 when role already exists during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockIsPrismaConflictError.mockReturnValueOnce(true);
    mockPrisma.role.create.mockRejectedValueOnce(new Error("duplicate"));

    const result = await service.create({
      name: "Developer",
      color: "#00ff00",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(409);
    expect(result.message).toBe("Role already exists");
  });

  it("creates a role when payload is valid", async () => {
    const created = {
      id: "r1",
      name: "Developer",
      color: "#00ff00",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.role.create.mockResolvedValueOnce(created);

    const result = await service.create({
      name: "  Developer ",
      color: " #00ff00 ",
      creatorId: " u1 ",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a role");
    expect(result.data).toEqual(created);
    expect(mockPrisma.role.create).toHaveBeenCalledWith({
      data: {
        name: "Developer",
        color: "#00ff00",
        creatorId: "u1",
      },
    });
  });

  it("returns 404 when getById cannot find role", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const result = await service.getById("missing-role");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Role with ID missing-role not found");
  });

  it("returns 400 when update has no fields", async () => {
    const result = await service.update("r1", {});

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "At least one field is required to update a role",
    );
    expect(mockPrisma.role.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update target does not exist", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-role", { name: "Lead" });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Role with ID missing-role not found");
    expect(mockPrisma.role.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update creator does not exist", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("r1", { creatorId: "missing-user" });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.role.update).not.toHaveBeenCalled();
  });

  it("updates a role when payload is valid", async () => {
    const updated = {
      id: "r1",
      name: "Lead",
      color: "#111111",
      creatorId: "u2",
    };

    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u2" });
    mockPrisma.role.update.mockResolvedValueOnce(updated);

    const result = await service.update("r1", {
      name: " Lead ",
      color: " #111111 ",
      creatorId: " u2 ",
    });

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Update role with ID: r1");
    expect(result.data).toEqual(updated);
    expect(mockPrisma.role.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: {
        name: "Lead",
        color: "#111111",
        creatorId: "u2",
      },
    });
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-role");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Role with ID missing-role not found");
    expect(mockPrisma.role.delete).not.toHaveBeenCalled();
  });

  it("returns 400 when delete hits foreign key constraint", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockIsPrismaForeignKeyError.mockReturnValueOnce(true);
    mockPrisma.role.delete.mockRejectedValueOnce(new Error("fk"));

    const result = await service.delete("r1");

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("Cannot delete role with associated records");
  });

  it("deletes a role when it exists", async () => {
    mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "r1" });
    mockPrisma.role.delete.mockResolvedValueOnce({ id: "r1" });

    const result = await service.delete("r1");

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Delete role with ID: r1");
    expect(mockPrisma.role.delete).toHaveBeenCalledWith({
      where: { id: "r1" },
    });
  });
});
