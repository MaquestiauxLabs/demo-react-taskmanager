import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { StatusesService } from "../../../services/statuses.service";
import {
  createTestStatus,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("StatusesService", () => {
  let service: StatusesService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new StatusesService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no statuses exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No statuses found");
    });

    it("should return all statuses", async () => {
      const user = await createTestUser();
      await createTestStatus({ name: "Status1", creatorId: user.id });
      await createTestStatus({ name: "Status2", creatorId: user.id });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all statuses");
      expect(result.data).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create a status with name and color", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "ToDo",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a status");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.name).toBe("ToDo");
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
        name: "ToDo",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color is required");
    });

    it("should return 400 when color is not a valid hex code", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "ToDo",
        color: "not-a-color",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        name: "ToDo",
        color: "#FF5733",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const result = await service.create({
        name: "ToDo",
        color: "#FF5733",
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when status name already exists", async () => {
      const user = await createTestUser();
      await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.create({
        name: "ToDo",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Status already exists");
    });
  });

  describe("getById", () => {
    it("should return status by ID", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.getById(status.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(status.id);
      expect(result.data!.name).toBe("ToDo");
    });

    it("should return 404 when status not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update status name", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        name: "InProgress",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.name).toBe("InProgress");
    });

    it("should update status color", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        color: "#00FF00",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.color).toBe("#00FF00");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        name: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("name cannot be empty");
    });

    it("should return 400 when color is empty string", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        color: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color cannot be empty");
    });

    it("should return 400 when color is invalid hex", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        color: "invalid",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {});

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "At least one field is required to update a status",
      );
    });

    it("should return 404 when status not found", async () => {
      const result = await service.update("nonexistent-id", {
        name: "ToDo",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.update(status.id, {
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when status name already exists", async () => {
      const user = await createTestUser();
      const status1 = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });
      const status2 = await createTestStatus({
        name: "Done",
        creatorId: user.id,
      });

      const result = await service.update(status2.id, {
        name: "ToDo",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Status already exists");
    });
  });

  describe("delete", () => {
    it("should delete status", async () => {
      const user = await createTestUser();
      const status = await createTestStatus({
        name: "ToDo",
        creatorId: user.id,
      });

      const result = await service.delete(status.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(status.id);

      const deleted = await prisma.status.findUnique({
        where: { id: status.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when status not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
