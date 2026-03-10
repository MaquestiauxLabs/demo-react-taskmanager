import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockIsPrismaConflictError, mockIsPrismaForeignKeyError } =
  vi.hoisted(() => {
    return {
      mockPrisma: {
        label: {
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
}));

import labelsRouter from "../../routes/labels.routes";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/labels", labelsRouter);
  return app;
};

describe("Labels API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/labels returns 404 when no labels exist", async () => {
    mockPrisma.label.findMany.mockResolvedValueOnce([]);

    const response = await request(buildApp()).get("/api/labels");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No labels found");
  });

  it("GET /api/labels returns list of labels", async () => {
    const labels = [{ id: "l1", name: "Backend", color: "#ff0000" }];
    mockPrisma.label.findMany.mockResolvedValueOnce(labels);

    const response = await request(buildApp()).get("/api/labels");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List all labels");
    expect(response.body.data).toEqual(labels);
  });

  it("POST /api/labels validates missing name", async () => {
    const response = await request(buildApp())
      .post("/api/labels")
      .send({ color: "#00ff00", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("name is required");
  });

  it("POST /api/labels validates invalid color", async () => {
    const response = await request(buildApp())
      .post("/api/labels")
      .send({ name: "Backend", color: "green", creatorId: "u1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("POST /api/labels creates a label", async () => {
    const created = {
      id: "l1",
      name: "Backend",
      color: "#ff0000",
      creatorId: "u1",
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.label.create.mockResolvedValueOnce(created);

    const response = await request(buildApp()).post("/api/labels").send({
      name: "Backend",
      color: "#ff0000",
      creatorId: "u1",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Create a label");
    expect(response.body.data).toEqual(created);
  });

  it("GET /api/labels/:id returns 404 when label is missing", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).get("/api/labels/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Label with ID missing not found");
  });

  it("GET /api/labels/:id returns a label", async () => {
    const label = { id: "l1", name: "Backend", color: "#ff0000" };
    mockPrisma.label.findUnique.mockResolvedValueOnce(label);

    const response = await request(buildApp()).get("/api/labels/l1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Get label by ID: l1");
    expect(response.body.data).toEqual(label);
  });

  it("PUT /api/labels/:id validates empty update payload", async () => {
    const response = await request(buildApp()).put("/api/labels/l1").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "At least one field is required to update a label",
    );
  });

  it("PUT /api/labels/:id validates invalid color", async () => {
    const response = await request(buildApp())
      .put("/api/labels/l1")
      .send({ color: "blue" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("color must be a valid hex code");
  });

  it("PUT /api/labels/:id updates an existing label", async () => {
    const updated = { id: "l1", name: "Frontend", color: "#0000ff" };
    mockPrisma.label.findUnique.mockResolvedValueOnce({ id: "l1" });
    mockPrisma.label.update.mockResolvedValueOnce(updated);

    const response = await request(buildApp())
      .put("/api/labels/l1")
      .send({ name: "Frontend", color: "#0000ff" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update label with ID: l1");
    expect(response.body.data).toEqual(updated);
  });

  it("DELETE /api/labels/:id returns 404 when label is missing", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce(null);

    const response = await request(buildApp()).delete("/api/labels/missing");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Label with ID missing not found");
  });

  it("DELETE /api/labels/:id deletes a label", async () => {
    mockPrisma.label.findUnique.mockResolvedValueOnce({ id: "l1" });
    mockPrisma.label.delete.mockResolvedValueOnce({ id: "l1" });

    const response = await request(buildApp()).delete("/api/labels/l1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delete label with ID: l1");
  });
});
