import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import projectsRouter from "../../../routes/projects.routes";
import {
  createTestUser,
  createTestProject,
  getTestPrisma,
  cleanDatabase,
} from "../../helpers";

describe("Projects Routes (Integration)", () => {
  let app: Express;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    app.use("/api/projects", projectsRouter);
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/projects", () => {
    it("should return 404 when no projects exist", async () => {
      const response = await request(app).get("/api/projects");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No projects found");
    });

    it("should return all projects", async () => {
      const user = await createTestUser();
      await createTestProject({ title: "Project1", creatorId: user.id });
      await createTestProject({ title: "Project2", creatorId: user.id });

      const response = await request(app).get("/api/projects");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("List all projects");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/projects", () => {
    it("should create a project", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/projects").send({
        title: "New Project",
        creatorId: user.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Create a project");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.title).toBe("New Project");
    });

    it("should return 400 when title is missing", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/projects").send({
        creatorId: user.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Project name is required");
    });

    it("should return 400 when creatorId is missing", async () => {
      const response = await request(app).post("/api/projects").send({
        title: "New Project",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("creatorId is required");
    });

    it("should return 400 when creator not found", async () => {
      const response = await request(app).post("/api/projects").send({
        title: "New Project",
        creatorId: "nonexistent-user-id",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/projects/:id", () => {
    it("should return project by ID", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const response = await request(app).get(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(project.id);
      expect(response.body.data.title).toBe("Test Project");
    });

    it("should return 404 when project not found", async () => {
      const response = await request(app).get("/api/projects/nonexistent-id");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("should update project", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Old Title",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({
          title: "New Title",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("New Title");
    });

    it("should return 404 when project not found", async () => {
      const response = await request(app)
        .put("/api/projects/nonexistent-id")
        .send({
          title: "New Title",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 400 when title is empty string", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({
          title: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Project name cannot be empty");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("should delete project", async () => {
      const user = await createTestUser();
      const project = await createTestProject({
        title: "Test Project",
        creatorId: user.id,
      });

      const response = await request(app).delete(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);

      const deleted = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 when project not found", async () => {
      const response = await request(app).delete(
        "/api/projects/nonexistent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });
  });
});
