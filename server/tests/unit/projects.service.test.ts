import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsService } from "../../services/projects.service";

// Mock dependencies
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../utils/prisma", () => ({
  prisma: {
    project: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("../../utils/api", () => ({
  standardiseResponse: (config: {
    message: string;
    httpStatus: number;
    data?: unknown;
    error?: unknown;
  }) => config,
}));

vi.mock("../../utils/normalizers", () => ({
  normalizeManyWithLabelsAndComments: (data: unknown) => data,
  normalizeWithLabelsAndComments: (data: unknown) => data,
}));

vi.mock("../../utils/prismaErrors", () => ({
  isPrismaConflictError: (error: unknown) =>
    error instanceof Error && error.message.includes("Unique constraint"),
  isPrismaForeignKeyError: (error: unknown) =>
    error instanceof Error && error.message.includes("Foreign key constraint"),
  isPrismaNotFoundError: (error: unknown) =>
    error instanceof Error &&
    error.message.includes("Record to update not found"),
}));

describe("ProjectsService", () => {
  let service: ProjectsService;

  beforeEach(() => {
    service = new ProjectsService();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should return 400 if name is missing", async () => {
      const result = await service.create({ name: "" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name is required");
    });

    it("should return 400 if name is only whitespace", async () => {
      const result = await service.create({ name: "   " });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name is required");
    });

    it("should return 400 if creator does not exist", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.create({
        name: "New Project",
        creatorId: "non-existent-creator",
      });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("Creator");
    });

    it("should return 409 on conflict error", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "creator-1" });
      mockCreate.mockRejectedValueOnce(new Error("Unique constraint failed"));
      const result = await service.create({
        name: "Duplicate Project",
        creatorId: "creator-1",
      });
      expect(result.httpStatus).toBe(409);
    });

    it("should return 400 on foreign key error", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "creator-1" });
      mockCreate.mockRejectedValueOnce(
        new Error("Foreign key constraint failed"),
      );
      const result = await service.create({
        name: "New Project",
        creatorId: "creator-1",
      });
      expect(result.httpStatus).toBe(400);
    });

    it("should create project successfully with valid data", async () => {
      const mockProject = { id: "proj-1", name: "New Project" };
      mockFindUnique.mockResolvedValueOnce({ id: "creator-1" });
      mockCreate.mockResolvedValueOnce(mockProject);
      const result = await service.create({
        name: "New Project",
        creatorId: "creator-1",
      });
      expect(result.httpStatus).toBe(201);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("getById", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.getById("");
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("ID is required");
    });

    it("should return 400 if id is only whitespace", async () => {
      const result = await service.getById("   ");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if project not found", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.getById("non-existent-id");
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return project if found", async () => {
      const mockProject = { id: "proj-1", name: "Test Project" };
      mockFindUnique.mockResolvedValueOnce(mockProject);
      const result = await service.getById("proj-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("update", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.update("", { name: "Updated" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("ID is required");
    });

    it("should return 400 if name is empty string", async () => {
      const result = await service.update("proj-1", { name: "" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name cannot be empty");
    });

    it("should return 404 if project does not exist", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.update("non-existent", { name: "Updated" });
      expect(result.httpStatus).toBe(404);
    });

    it("should return 404 on Prisma not found error", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockUpdate.mockRejectedValueOnce(new Error("Record to update not found"));
      const result = await service.update("proj-1", { name: "Updated" });
      expect(result.httpStatus).toBe(404);
    });

    it("should return 409 on conflict error", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockUpdate.mockRejectedValueOnce(new Error("Unique constraint failed"));
      const result = await service.update("proj-1", {
        name: "Duplicate Name",
      });
      expect(result.httpStatus).toBe(409);
    });

    it("should update project successfully", async () => {
      const mockProject = { id: "proj-1", name: "Updated Project" };
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockUpdate.mockResolvedValueOnce(mockProject);
      const result = await service.update("proj-1", {
        name: "Updated Project",
      });
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("delete", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.delete("");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if project does not exist", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.delete("non-existent");
      expect(result.httpStatus).toBe(404);
    });

    it("should return 400 on foreign key constraint error", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockDelete.mockRejectedValueOnce(
        new Error("Foreign key constraint failed"),
      );
      const result = await service.delete("proj-1");
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("associated records");
    });

    it("should delete project successfully", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockDelete.mockResolvedValueOnce({ id: "proj-1" });
      const result = await service.delete("proj-1");
      expect(result.httpStatus).toBe(200);
    });
  });

  describe("archive", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.archive("");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if project not found", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.archive("non-existent");
      expect(result.httpStatus).toBe(404);
    });

    it("should archive project successfully", async () => {
      const mockProject = { id: "proj-1", isArchived: true };
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockUpdate.mockResolvedValueOnce(mockProject);
      const result = await service.archive("proj-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("unarchive", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.unarchive("");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if project not found", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.unarchive("non-existent");
      expect(result.httpStatus).toBe(404);
    });

    it("should unarchive project successfully", async () => {
      const mockProject = { id: "proj-1", isArchived: false };
      mockFindUnique.mockResolvedValueOnce({ id: "proj-1" });
      mockUpdate.mockResolvedValueOnce(mockProject);
      const result = await service.unarchive("proj-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("assignUser", () => {
    it("should return 400 if projectId is empty", async () => {
      const result = await service.assignUser("", "user-1");
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("Project ID is required");
    });

    it("should return 400 if userId is empty", async () => {
      const result = await service.assignUser("proj-1", "");
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("User ID is required");
    });

    it("should return 404 if project not found", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.assignUser("non-existent", "user-1");
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("Project");
    });

    it("should return 404 if user not found", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ id: "proj-1" })
        .mockResolvedValueOnce(null);
      const result = await service.assignUser("proj-1", "non-existent");
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("User");
    });

    it("should return 409 on duplicate assignment", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ id: "proj-1" })
        .mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockRejectedValueOnce(new Error("Unique constraint failed"));
      const result = await service.assignUser("proj-1", "user-1");
      expect(result.httpStatus).toBe(409);
      expect(result.message).toContain("already assigned");
    });

    it("should assign user successfully", async () => {
      const mockProject = { id: "proj-1", name: "Test Project" };
      mockFindUnique
        .mockResolvedValueOnce({ id: "proj-1" })
        .mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockResolvedValueOnce(mockProject);
      const result = await service.assignUser("proj-1", "user-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });

  describe("unassignUser", () => {
    it("should return 400 if projectId is empty", async () => {
      const result = await service.unassignUser("", "user-1");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 400 if userId is empty", async () => {
      const result = await service.unassignUser("proj-1", "");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if project not found", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      const result = await service.unassignUser("non-existent", "user-1");
      expect(result.httpStatus).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      mockFindUnique
        .mockResolvedValueOnce({ id: "proj-1" })
        .mockResolvedValueOnce(null);
      const result = await service.unassignUser("proj-1", "non-existent");
      expect(result.httpStatus).toBe(404);
    });

    it("should unassign user successfully", async () => {
      const mockProject = { id: "proj-1", name: "Test Project" };
      mockFindUnique
        .mockResolvedValueOnce({ id: "proj-1" })
        .mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockResolvedValueOnce(mockProject);
      const result = await service.unassignUser("proj-1", "user-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockProject);
    });
  });
});
