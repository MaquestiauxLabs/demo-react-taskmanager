import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { ProjectsService } from "../../../services/projects.service";
import {
  createTestProject,
  createTestUser,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    service = new ProjectsService();
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("get", () => {
    it("should return 404 when no projects exist", async () => {
      const result = await service.get();

      expect(result.httpStatus).toBe(404);
      expect(result.message).toBe("No projects found");
    });

    it("should return all projects", async () => {
      const user = await createTestUser();
      await createTestProject({ title: "Project1", creatorId: user.id });
      await createTestProject({ title: "Project2", creatorId: user.id });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.message).toBe("List all projects");
      expect(result.data).toHaveLength(2);
    });

    it("should exclude archived projects", async () => {
      const user = await createTestUser();
      await createTestProject({ title: "Active Project", creatorId: user.id });
      await prisma.project.create({
        data: {
          title: "Archived Project",
          creatorId: user.id,
          isArchived: true,
        },
      });

      const result = await service.get();

      expect(result.httpStatus).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Active Project");
    });
  });

  describe("create", () => {
    it("should create a project with title", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "New Project",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.message).toBe("Create a project");
      expect(result.data).toHaveProperty("id");
      expect(result.data!.title).toBe("New Project");
    });

    it("should create a project with name as title", async () => {
      const user = await createTestUser();

      const result = await service.create({
        name: "My Project",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(201);
      expect(result.data!.title).toBe("My Project");
    });

    it("should return 400 when title is missing", async () => {
      const user = await createTestUser();

      const result = await service.create({
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("Project name is required");
    });

    it("should return 400 when title is empty", async () => {
      const user = await createTestUser();

      const result = await service.create({
        title: "",
        creatorId: user.id,
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("Project name is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const result = await service.create({
        title: "New Project",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("creatorId is required");
    });

    it("should return 400 when creator not found", async () => {
      const result = await service.create({
        title: "New Project",
        creatorId: "nonexistent-user-id",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toContain("not found");
    });
  });

  describe("getById", () => {
    it("should return project by ID", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const result = await service.getById(project.id);

      expect(result.httpStatus).toBe(200);
      expect(result.data!.id).toBe(project.id);
      expect(result.data!.title).toBe("Test Project");
    });

    it("should return 404 when project not found", async () => {
      const result = await service.getById("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });

  describe("update", () => {
    it("should update project title", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Old Title",
        creatorId: user.id,
      });

      const result = await service.update(project.id, {
        title: "New Title",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.title).toBe("New Title");
    });

    it("should update project description", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const result = await service.update(project.id, {
        description: "New description",
      });

      expect(result.httpStatus).toBe(200);
      expect(result.data!.description).toBe("New description");
    });

    it("should return 404 when project not found", async () => {
      const result = await service.update("nonexistent-id", {
        title: "New Title",
      });

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });

    it("should return 400 when title is empty string", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const result = await service.update(project.id, {
        title: "",
      });

      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe("Project name cannot be empty");
    });
  });

  describe("delete", () => {
    it("should delete project", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const result = await service.delete(project.id);

      expect(result.httpStatus).toBe(200);

      const deleted = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when project not found", async () => {
      const result = await service.delete("nonexistent-id");

      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain("not found");
    });
  });
});
