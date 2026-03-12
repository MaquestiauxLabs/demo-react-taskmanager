import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PrioritiesService } from "../../../services/priorities.service";
import {
  createTestPriority,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("PrioritiesService", () => {
  let service: PrioritiesService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new PrioritiesService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no priorities exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No priorities found");
    });

    it("should return all priorities", async () => {
      const user = await createTestUser();
      await createTestPriority({ name: "Priority1", creatorId: user.id });
      await createTestPriority({ name: "Priority2", creatorId: user.id });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all priorities");
      expect(result.data).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create a priority with name and color", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "High",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a priority");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.name).toBe("High");
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
        name: "High",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color is required");
    });

    it("should return 400 when color is not a valid hex code", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "High",
        color: "not-a-color",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        name: "High",
        color: "#FF5733",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const result = await service.create({
        name: "High",
        color: "#FF5733",
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when priority name already exists", async () => {
      const user = await createTestUser();
      await createTestPriority({ name: "High", creatorId: user.id });

      const result = await service.create({
        name: "High",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Priority already exists");
    });
  });

  describe("getById", () => {
    it("should return priority by ID", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.getById(priority.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(priority.id);
      expect(result.data!.name).toBe("High");
    });

    it("should return 404 when priority not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update priority name", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        name: "Critical",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.name).toBe("Critical");
    });

    it("should update priority color", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        color: "#00FF00",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.color).toBe("#00FF00");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        name: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("name cannot be empty");
    });

    it("should return 400 when color is empty string", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        color: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color cannot be empty");
    });

    it("should return 400 when color is invalid hex", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        color: "invalid",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {});

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "At least one field is required to update a priority",
      );
    });

    it("should return 404 when priority not found", async () => {
      const result = await service.update("nonexistent-id", {
        name: "High",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.update(priority.id, {
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when priority name already exists", async () => {
      const user = await createTestUser();
      const priority1 = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });
      const priority2 = await createTestPriority({
        name: "Low",
        creatorId: user.id,
      });

      const result = await service.update(priority2.id, {
        name: "High",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Priority already exists");
    });
  });

  describe("delete", () => {
    it("should delete priority", async () => {
      const user = await createTestUser();
      const priority = await createTestPriority({
        name: "High",
        creatorId: user.id,
      });

      const result = await service.delete(priority.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(priority.id);

      const deleted = await prisma.priority.findUnique({
        where: { id: priority.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when priority not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
