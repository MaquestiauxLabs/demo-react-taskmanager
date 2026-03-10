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

import { PrioritiesService } from "../../services/priorities.service";

describe("PrioritiesService", () => {
  let service: PrioritiesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrioritiesService();
  });

  it("returns 404 when no priorities are found", async () => {
    mockPrisma.priority.findMany.mockResolvedValueOnce([]);

    const result = await service.get();

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("No priorities found");
  });

  it("returns 400 when create payload is missing name", async () => {
    const result = await service.create({ color: "#00ff00", creatorId: "u1" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("name is required");
    expect(mockPrisma.priority.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator is not found during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      name: "High",
      color: "#ff0000",
      creatorId: "missing-user",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.priority.create).not.toHaveBeenCalled();
  });

  it("creates a priority when payload is valid", async () => {
    const created = {
      id: "p1",
      name: "High",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.priority.create.mockResolvedValueOnce(created);

    const result = await service.create({
      name: "High",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a priority");
    expect(result.data).toEqual(created);
    expect(mockPrisma.priority.create).toHaveBeenCalledWith({
      data: {
        name: "High",
        color: "#ff0000",
        creatorId: "u1",
      },
    });
  });

  it("returns 404 when getById cannot find priority", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const result = await service.getById("missing-priority");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Priority with ID missing-priority not found");
  });

  it("returns 400 when update has no fields", async () => {
    const result = await service.update("p1", {});

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe(
      "At least one field is required to update a priority",
    );
    expect(mockPrisma.priority.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update target does not exist", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-priority", { name: "Medium" });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Priority with ID missing-priority not found");
    expect(mockPrisma.priority.update).not.toHaveBeenCalled();
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-priority");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Priority with ID missing-priority not found");
    expect(mockPrisma.priority.delete).not.toHaveBeenCalled();
  });

  it("deletes a priority when it exists", async () => {
    mockPrisma.priority.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.priority.delete.mockResolvedValueOnce({ id: "p1" });

    const result = await service.delete("p1");

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Delete priority with ID: p1");
    expect(mockPrisma.priority.delete).toHaveBeenCalledWith({
      where: { id: "p1" },
    });
  });
});
