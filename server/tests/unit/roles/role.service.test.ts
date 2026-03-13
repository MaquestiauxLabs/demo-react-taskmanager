import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { RolesService } from "../../../services/roles.service";
import {
  createTestRole,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("RolesService", () => {
  let service: RolesService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new RolesService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no roles exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No roles found");
    });

    it("should return all roles", async () => {
      const user = await createTestUser();
      await createTestRole({ name: "Role1", creatorId: user.id });
      await createTestRole({ name: "Role2", creatorId: user.id });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all roles");
      expect(result.data).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create a role with name and color", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "Admin",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a role");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.name).toBe("Admin");
      expect(result.data!.color).toBe("#FF5733");
    });

    it("should return 400 when name is missing", async () => {
      const user = await createTestUser();

      const result = await service.create({
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("name is required");
    });

    it("should return 400 when color is missing", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "Admin",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color is required");
    });

    it("should return 400 when color is not a valid hex code", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "Admin",
        color: "not-a-color",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        name: "Admin",
        color: "#FF5733",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const result = await service.create({
        name: "Admin",
        color: "#FF5733",
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when role name already exists", async () => {
      const user = await createTestUser();
      await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.create({
        name: "Admin",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Role already exists");
    });
  });

  describe("getById", () => {
    it("should return role by ID", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.getById(role.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(role.id);
      expect(result.data!.name).toBe("Admin");
    });

    it("should return 404 when role not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update role name", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.update(role.id, {
        name: "SuperAdmin",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.name).toBe("SuperAdmin");
    });

    it("should update role color", async () => {
      const user = await createTestUser();
      const role = await createTestRole({
        name: "Admin",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(role.id, {
        color: "#00FF00",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.color).toBe("#00FF00");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.update(role.id, {
        name: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("name cannot be empty");
    });

    it("should return 400 when color is empty string", async () => {
      const user = await createTestUser();
      const role = await createTestRole({
        name: "Admin",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(role.id, {
        color: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color cannot be empty");
    });

    it("should return 400 when color is invalid hex", async () => {
      const user = await createTestUser();
      const role = await createTestRole({
        name: "Admin",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(role.id, {
        color: "invalid",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.update(role.id, {});

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "At least one field is required to update a role",
      );
    });

    it("should return 404 when role not found", async () => {
      const result = await service.update("nonexistent-id", {
        name: "Admin",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.update(role.id, {
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when role name already exists", async () => {
      const user = await createTestUser();
      const role1 = await createTestRole({ name: "Admin", creatorId: user.id });
      const role2 = await createTestRole({ name: "User", creatorId: user.id });

      const result = await service.update(role2.id, {
        name: "Admin",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Role already exists");
    });
  });

  describe("delete", () => {
    it("should delete role", async () => {
      const user = await createTestUser();
      const role = await createTestRole({ name: "Admin", creatorId: user.id });

      const result = await service.delete(role.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(role.id);

      const deleted = await prisma.role.findUnique({ where: { id: role.id } });
      expect(deleted).toBeNull();
    });

    it("should return 404 when role not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
