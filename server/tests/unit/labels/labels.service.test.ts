import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { LabelsService } from "../../../services/labels.service";
import {
  createTestLabel,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("LabelsService", () => {
  let service: LabelsService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new LabelsService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no labels exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No labels found");
    });

    it("should return all labels", async () => {
      const user = await createTestUser();
      await createTestLabel({
        name: "Label1",
        color: "#FF0000",
        creatorId: user.id,
      });
      await createTestLabel({
        name: "Label2",
        color: "#00FF00",
        creatorId: user.id,
      });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all labels");
      expect(result.data).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create a label with name and color", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a label");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.name).toBe("Bug");
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
        name: "Bug",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color is required");
    });

    it("should return 400 when color is not a valid hex code", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "Bug",
        color: "not-a-color",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        name: "Bug",
        color: "#FF5733",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const result = await service.create({
        name: "Bug",
        color: "#FF5733",
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when label name already exists", async () => {
      const user = await createTestUser();
      await createTestLabel({
        name: "Bug",
        color: "#FF0000",
        creatorId: user.id,
      });

      const result = await service.create({
        name: "Bug",
        color: "#00FF00",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Label already exists");
    });
  });

  describe("getById", () => {
    it("should return label by ID", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.getById(label.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(label.id);
      expect(result.data!.name).toBe("Bug");
    });

    it("should return 404 when label not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update label name", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        name: "Feature",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.name).toBe("Feature");
    });

    it("should update label color", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        color: "#00FF00",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.color).toBe("#00FF00");
    });

    it("should return 400 when name is empty string", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        name: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("name cannot be empty");
    });

    it("should return 400 when color is empty string", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        color: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color cannot be empty");
    });

    it("should return 400 when color is invalid hex", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        color: "invalid",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("color must be a valid hex code");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {});

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe(
        "At least one field is required to update a label",
      );
    });

    it("should return 404 when label not found", async () => {
      const result = await service.update("nonexistent-id", {
        name: "Bug",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 404 when creatorId does not exist", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.update(label.id, {
        creatorId: "nonexistent-id",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 409 when label name already exists", async () => {
      const user = await createTestUser();
      const _label1 = await createTestLabel({
        name: "Bug",
        color: "#FF0000",
        creatorId: user.id,
      });
      const label2 = await createTestLabel({
        name: "Feature",
        color: "#00FF00",
        creatorId: user.id,
      });

      const result = await service.update(label2.id, {
        name: "Bug",
      });

      expect(result.httpStatus).toBe(409);
      expect(result.message).toBe("Label already exists");
    });
  });

  describe("delete", () => {
    it("should delete label", async () => {
      const user = await createTestUser();
      const label = await createTestLabel({
        name: "Bug",
        color: "#FF5733",
        creatorId: user.id,
      });

      const result = await service.delete(label.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(label.id);

      const deleted = await prisma.label.findUnique({
        where: { id: label.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when label not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
