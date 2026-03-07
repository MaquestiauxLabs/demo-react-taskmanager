import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      label: {
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

import { LabelsService } from "../labels.service";

describe("LabelsService", () => {
  let service: LabelsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LabelsService();
  });

  it("returns 404 when no labels are found", async () => {
    mockPrisma.label.findMany.mockResolvedValueOnce([]);

    const result = await service.get();

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("No labels found");
  });

  it("returns 400 when create payload is missing name", async () => {
    const result = await service.create({ color: "#00ff00", creatorId: "u1" });

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("name is required");
    expect(mockPrisma.label.create).not.toHaveBeenCalled();
  });

  it("returns 404 when creator is not found during create", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.create({
      name: "Backend",
      color: "#ff0000",
      creatorId: "missing-user",
    });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("User with ID missing-user not found");
    expect(mockPrisma.label.create).not.toHaveBeenCalled();
  });

  it("creates a label when payload is valid", async () => {
    const created = {
      id: "l1",
      name: "Backend",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.label.create.mockResolvedValueOnce(created);

    const result = await service.create({
      name: "Backend",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(result.httpStatus).toBe(201);
    expect(result.message).toBe("Create a label");
    expect(result.data).toEqual(created);
    expect(mockPrisma.label.create).toHaveBeenCalledWith({
      data: {
        name: "Backend",
        color: "#ff0000",
        creatorId: "u1",
      },
    });
  });

  it("returns 404 when getById cannot find label", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce(null);

    const result = await service.getById("missing-label");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Label with ID missing-label not found");
  });

  it("returns 400 when update has no fields", async () => {
    const result = await service.update("l1", {});

    expect(result.httpStatus).toBe(400);
    expect(result.message).toBe("At least one field is required to update a label");
    expect(mockPrisma.label.update).not.toHaveBeenCalled();
  });

  it("returns 404 when update target does not exist", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce(null);

    const result = await service.update("missing-label", { name: "Frontend" });

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Label with ID missing-label not found");
    expect(mockPrisma.label.update).not.toHaveBeenCalled();
  });

  it("returns 404 when delete target does not exist", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce(null);

    const result = await service.delete("missing-label");

    expect(result.httpStatus).toBe(404);
    expect(result.message).toBe("Label with ID missing-label not found");
    expect(mockPrisma.label.delete).not.toHaveBeenCalled();
  });

  it("deletes a label when it exists", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce({ id: "l1" });
    mockPrisma.label.delete.mockResolvedValueOnce({ id: "l1" });

    const result = await service.delete("l1");

    expect(result.httpStatus).toBe(200);
    expect(result.message).toBe("Delete label with ID: l1");
    expect(mockPrisma.label.delete).toHaveBeenCalledWith({
      where: { id: "l1" },
    });
  });
});
