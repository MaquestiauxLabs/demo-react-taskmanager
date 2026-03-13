import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { UsersService } from "../../../services/users.service";
import { createTestUser, getTestPrisma, cleanDatabase } from "../../helpers";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new UsersService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no users exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No users found");
    });

    it("should return all users", async () => {
      await createTestUser({
        email: "user1@test.com",
        givenName: "User",
        familyName: "One",
      });
      await createTestUser({
        email: "user2@test.com",
        givenName: "User",
        familyName: "Two",
      });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all users");
      expect(result.data).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create a user with givenName and familyName", async () => {
      const result = await service.create({
        givenName: "John",
        familyName: "Doe",
        email: "john@example.com",
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a user");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.email).toBe("john@example.com");
      expect(result.data!.givenName).toBe("John");
      expect(result.data!.familyName).toBe("Doe");
    });

    it("should create a user with legacy name format", async () => {
      const result = await service.create({
        name: "Jane Smith",
        email: "jane@example.com",
      });

      expect(result.httpStatus).toBe(201);
      expect(result.data!.givenName).toBe("Jane");
      expect(result.data!.familyName).toBe("Smith");
    });

    it("should return 400 when givenName is missing", async () => {
      const result = await service.create({
        familyName: "Doe",
        email: "john@example.com",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User name is required");
    });

    it("should return 400 when familyName is missing", async () => {
      const result = await service.create({
        givenName: "John",
        email: "john@example.com",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User name is required");
    });

    it("should return 400 when email is missing", async () => {
      const result = await service.create({
        givenName: "John",
        familyName: "Doe",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User email is required");
    });

    it("should return 400 when email is empty string", async () => {
      const result = await service.create({
        givenName: "John",
        familyName: "Doe",
        email: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User email is required");
    });

    it("should return 409 when email already exists", async () => {
      await createTestUser({ email: "existing@example.com" });

      const result = await service.create({
        givenName: "John",
        familyName: "Doe",
        email: "existing@example.com",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("User with this email already exists");
    });

    it("should create user with avatarUrl", async () => {
      const result = await service.create({
        givenName: "John",
        familyName: "Doe",
        email: "john@example.com",
        avatarUrl: "https://example.com/avatar.png",
      });

      expect(result.httpStatus).toBe(201);
      expect(result.data!.avatarUrl).toBe("https://example.com/avatar.png");
    });
  });

  describe("getById", () => {
    it("should return user by ID", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const result = await service.getById(user.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(user.id);
      expect(result.data!.email).toBe("test@example.com");
    });

    it("should return 400 when id is empty", async () => {
      const result = await service.getById("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User ID is required");
    });

    it("should return 404 when user not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update user givenName and familyName", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const result = await service.update(user.id, {
        givenName: "Updated",
        familyName: "Name",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.givenName).toBe("Updated");
      expect(result.data!.familyName).toBe("Name");
    });

    it("should update user email", async () => {
      const user = await createTestUser({ email: "old@example.com" });

      const result = await service.update(user.id, {
        email: "new@example.com",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.email).toBe("new@example.com");
    });

    it("should update user with avatarUrl", async () => {
      const user = await createTestUser({
        email: "test@example.com",
        avatarUrl: null,
      });

      const result = await service.update(user.id, {
        avatarUrl: "https://example.com/new-avatar.png",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.avatarUrl).toBe("https://example.com/new-avatar.png");
    });

    it("should return 400 when id is empty", async () => {
      const result = await service.update("", {
        givenName: "Updated",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User ID is required");
    });

    it("should return 404 when user not found", async () => {
      const result = await service.update("nonexistent-id", {
        givenName: "Updated",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when updating to existing email", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      await createTestUser({ email: "user2@example.com" });

      const result = await service.update(user1.id, {
        email: "user2@example.com",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("User with this email already exists");
    });

    it("should return 400 when givenName is empty string", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const result = await service.update(user.id, {
        givenName: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User name cannot be empty");
    });

    it("should return 400 when email is empty string", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const result = await service.update(user.id, {
        email: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User email cannot be empty");
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      const user = await createTestUser({ email: "test@example.com" });

      const result = await service.delete(user.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(user.id);

      const deleted = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it("should return 400 when id is empty", async () => {
      const result = await service.delete("");

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("User ID is required");
    });

    it("should return 404 when user not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
