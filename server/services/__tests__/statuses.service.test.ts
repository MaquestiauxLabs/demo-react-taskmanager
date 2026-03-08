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

import { StatusesService } from "../statuses.service";

describe("StatusesService", () => {
  let service: StatusesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StatusesService();
  });

  it("returns 404 when no statuses are found", async () => {
    mockPrisma.status.findMany.mockResolvedValueOnce([]);

    const result = await service.get();

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("No statuses found");
  });

  it("returns 400 when create payload is missing name", async () => {
    const result = await service.create({ color: "#00ff00", creatorId: "u1" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("name is required");
    expect(mockPrisma.status.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator is not found during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      name: "In Progress",
      color: "#ff0000",
      creatorId: "missing-user",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.status.create).not.toHaveBeenCalled();
  });

  it("creates a status when payload is valid", async () => {
    const created = {
      id: "s1",
      name: "In Progress",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.status.create.mockResolvedValueOnce(created);

    const result = await service.create({
      name: "In Progress",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a status");
    expect(result.data).toEqual(created);
    expect(mockPrisma.status.create).toHaveBeenCalledWith({
      data: {
        name: "In Progress",
        color: "#ff0000",
        creatorId: "u1",
      },
    });
  });

  it("returns 404 when getById cannot find status", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce(null);

    const result = await service.getById("missing-status");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Status with ID missing-status not found");
  });

  it("returns 400 when update has no fields", async () => {
    const result = await service.update("s1", {});

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "At least one field is required to update a status",
    );
    expect(mockPrisma.status.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update target does not exist", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-status", {
      name: "Blocked",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Status with ID missing-status not found");
    expect(mockPrisma.status.update).not.toHaveBeenCalled();
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-status");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Status with ID missing-status not found");
    expect(mockPrisma.status.delete).not.toHaveBeenCalled();
  });

  it("deletes a status when it exists", async () => {
    mockPrisma.status.findUnique.mockResolvedValueOnce({ id: "s1" });
    mockPrisma.status.delete.mockResolvedValueOnce({ id: "s1" });

    const result = await service.delete("s1");

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Delete status with ID: s1");
    expect(mockPrisma.status.delete).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
  });
});
