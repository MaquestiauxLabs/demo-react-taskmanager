import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrisma,
  mockIsPrismaConflictError,
  mockIsPrismaForeignKeyError,
  mockIsPrismaNotFoundError,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      project: {
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
    mockIsPrismaNotFoundError: vi.fn(() => false),
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
  isPrismaNotFoundError: mockIsPrismaNotFoundError,
  normalizeWithLabelsAndComments: <T>(entity: T) => entity,
  normalizeManyWithLabelsAndComments: <T>(entities: T[]) => entities,
}));

import projectsRouter from "../../routes/projects.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/projects", projectsRouter);
  return app;
};

describe("Projects API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/projects returns 404 when no projects exist", async () => {
    mockPrisma.project.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/projects");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No projects found");
  });

  it("GET /api/projects returns projects list", async () => {
    const projects = [{ id: "p1", name: "Alpha", isArchived: false }];
    mockPrisma.project.findMany.mockResolvedValueOnce(projects);

    const response = await request(buildApp()).get("/api/projects");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all projects");
    expect(response.body.data).toEqual(projects);
  });

  it("POST /api/projects validates required name", async () => {
    const response = await request(buildApp())
      .post("/api/projects")
      .send({ creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Project name is required");
  });

  it("POST /api/projects creates project", async () => {
    const created = { id: "p1", name: "Alpha", creatorId: "u1" };
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.project.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/projects").send({
      name: "Alpha",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a project");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/projects/:id returns 404 when project is missing", async () => {
    mockPrisma.project.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/projects/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Project with ID missing not found");
  });

  it("PUT /api/projects/:id validates empty name", async () => {
    const response = await request(buildApp())
      .put("/api/projects/p1")
      .send({ name: "  " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Project name cannot be empty");
  });

  it("PUT /api/projects/:id updates project", async () => {
    const updated = { id: "p1", name: "Alpha v2" };
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.project.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/projects/p1")
      .send({ name: "Alpha v2" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update project with ID: p1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/projects/:id returns 404 when project is missing", async () => {
    mockPrisma.project.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/projects/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Project with ID missing not found");
  });

  it("PUT /api/projects/:id/archive archives project", async () => {
    const archived = { id: "p1", isArchived: true };
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.project.update.mockResolvedValueOnce(archived);

    const response = await request(buildApp()).put("/api/projects/p1/archive");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Archive project with ID: p1");
    expect(response.body.data).toEqual(archived);
  });

  it("PUT /api/projects/:id/unarchive unarchives project", async () => {
    const unarchived = { id: "p1", isArchived: false };
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.project.update.mockResolvedValueOnce(unarchived);

    const response = await request(buildApp()).put(
      "/api/projects/p1/unarchive",
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Unarchive project with ID: p1");
    expect(response.body.data).toEqual(unarchived);
  });

  it("POST /api/projects/:id/assignee validates missing userId", async () => {
    const response = await request(buildApp())
      .post("/api/projects/p1/assignee")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User ID is required");
  });

  it("POST /api/projects/:id/assignee assigns user", async () => {
    const updated = { id: "p1" };
    mockPrisma.project.findUnique.mockResolvedValueOnce({ id: "p1" });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.project.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .post("/api/projects/p1/assignee")
      .send({ userId: "u1" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Assign user u1 to project p1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/projects/:id/assignee validates missing userId", async () => {
    const response = await request(buildApp())
      .delete("/api/projects/p1/assignee")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User ID is required");
  });
});
