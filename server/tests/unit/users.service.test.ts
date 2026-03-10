import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersService } from "../../services/users.service";

// Mock dependencies
const mockFindMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockRoleFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../utils/prisma", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    role: {
      findUnique: (...args: unknown[]) => mockRoleFindUnique(...args),
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

vi.mock("../../utils/prismaErrors", () => ({
  isPrismaConflictError: (error: unknown) =>
    error instanceof Error && error.message.includes("Unique constraint"),
  isPrismaForeignKeyError: (error: unknown) =>
    error instanceof Error && error.message.includes("Foreign key constraint"),
  isPrismaNotFoundError: (error: unknown) =>
    error instanceof Error &&
    error.message.includes("Record to update not found"),
}));

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("should return 404 if no users found", async () => {
      mockFindMany.mockResolvedValueOnce([]);
      const result = await service.get();
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("No users found");
    });

    it("should return users list successfully", async () => {
      const mockUsers = [
        { id: "user-1", name: "John", email: "john@example.com" },
        { id: "user-2", name: "Jane", email: "jane@example.com" },
      ];
      mockFindMany.mockResolvedValueOnce(mockUsers);
      const result = await service.get();
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockUsers);
    });

    it("should return 500 on unexpected error", async () => {
      mockFindMany.mockRejectedValueOnce(new Error("Database error"));
      const result = await service.get();
      expect(result.httpStatus).toBe(500);
    });
  });

  describe("create", () => {
    it("should return 400 if name is missing", async () => {
      const result = await service.create({
        name: "",
        email: "test@example.com",
      });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name is required");
    });

    it("should return 400 if name is only whitespace", async () => {
      const result = await service.create({
        name: "   ",
        email: "test@example.com",
      });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name is required");
    });

    it("should return 400 if email is missing", async () => {
      const result = await service.create({ name: "John Doe", email: "" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("email is required");
    });

    it("should return 400 if email is only whitespace", async () => {
      const result = await service.create({ name: "John Doe", email: "   " });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("email is required");
    });

    it("should return 400 if role does not exist", async () => {
      mockRoleFindUnique.mockResolvedValueOnce(null);
      const result = await service.create({
        name: "John Doe",
        email: "john@example.com",
        roleId: "non-existent-role",
      });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("Role");
    });

    it("should return 409 on conflict error (duplicate email)", async () => {
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockCreate.mockRejectedValueOnce(new Error("Unique constraint failed"));
      const result = await service.create({
        name: "John Doe",
        email: "duplicate@example.com",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(409);
      expect(result.message).toContain("email already exists");
    });

    it("should return 400 on foreign key error", async () => {
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockCreate.mockRejectedValueOnce(
        new Error("Foreign key constraint failed"),
      );
      const result = await service.create({
        name: "John Doe",
        email: "john@example.com",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(400);
    });

    it("should create user successfully with valid data", async () => {
      const mockUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
      };
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockCreate.mockResolvedValueOnce(mockUser);
      const result = await service.create({
        name: "John Doe",
        email: "john@example.com",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(201);
      expect(result.data).toBe(mockUser);
    });

    it("should create user successfully without roleId", async () => {
      const mockUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
      };
      mockCreate.mockResolvedValueOnce(mockUser);
      const result = await service.create({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(result.httpStatus).toBe(201);
      expect(result.data).toBe(mockUser);
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

    it("should return 404 if user not found", async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);
      const result = await service.getById("non-existent-id");
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return user if found", async () => {
      const mockUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
      };
      mockUserFindUnique.mockResolvedValueOnce(mockUser);
      const result = await service.getById("user-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockUser);
    });
  });

  describe("update", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.update("", { name: "Updated" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("ID is required");
    });

    it("should return 400 if name is empty string", async () => {
      const result = await service.update("user-1", { name: "" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("name cannot be empty");
    });

    it("should return 400 if email is empty string", async () => {
      const result = await service.update("user-1", { email: "" });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("email cannot be empty");
    });

    it("should return 400 if role does not exist", async () => {
      mockRoleFindUnique.mockResolvedValueOnce(null);
      const result = await service.update("user-1", {
        roleId: "non-existent-role",
      });
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("Role");
    });

    it("should return 404 if user does not exist", async () => {
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockUserFindUnique.mockResolvedValueOnce(null);
      const result = await service.update("non-existent", {
        name: "Updated",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(404);
    });

    it("should return 404 on Prisma not found error", async () => {
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockRejectedValueOnce(new Error("Record to update not found"));
      const result = await service.update("user-1", {
        name: "Updated",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(404);
    });

    it("should return 409 on conflict error (duplicate email)", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockRejectedValueOnce(new Error("Unique constraint failed"));
      const result = await service.update("user-1", {
        email: "duplicate@example.com",
      });
      expect(result.httpStatus).toBe(409);
    });

    it("should update user successfully", async () => {
      const mockUser = { id: "user-1", name: "Updated User" };
      mockRoleFindUnique.mockResolvedValueOnce({ id: "role-1" });
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
      mockUpdate.mockResolvedValueOnce(mockUser);
      const result = await service.update("user-1", {
        name: "Updated User",
        roleId: "role-1",
      });
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockUser);
    });
  });

  describe("delete", () => {
    it("should return 400 if id is empty", async () => {
      const result = await service.delete("");
      expect(result.httpStatus).toBe(400);
    });

    it("should return 404 if user does not exist", async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);
      const result = await service.delete("non-existent");
      expect(result.httpStatus).toBe(404);
    });

    it("should return 400 on foreign key constraint error", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
      mockDelete.mockRejectedValueOnce(
        new Error("Foreign key constraint failed"),
      );
      const result = await service.delete("user-1");
      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("associated records");
    });

    it("should delete user successfully", async () => {
      const mockUser = { id: "user-1", name: "John Doe" };
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
      mockDelete.mockResolvedValueOnce(mockUser);
      const result = await service.delete("user-1");
      expect(result.httpStatus).toBe(200);
      expect(result.data).toBe(mockUser);
    });
  });
});
