import {
  ProjectCreateInput,
  ProjectUpdateInput,
} from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class ProjectsService {
  async get() {
    try {
      const response = await prisma.project.findMany({
        include: {
          labels: true,
        },
      });
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No projects found",
          httpStatus: 404,
          error: "No projects found in the database",
        });
      }
      return standardiseResponse({
        message: "List all projects",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching projects",
        httpStatus: 500,
        error: error,
      });
    }
  }

  async create(data: ProjectCreateInput) {
    try {
      const response = await prisma.project.create({
        data,
        include: {
          labels: true,
        },
      });
      return standardiseResponse({
        message: "Create a project",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating project",
        httpStatus: 500,
        error: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.project.findUnique({
        where: { id },
        include: {
          labels: true,
        },
      });
      if (!response) {
        return standardiseResponse({
          message: `Project with ID ${id} not found`,
          httpStatus: 404,
          error: `No project found with ID ${id} in the database`,
        });
      }
      return standardiseResponse({
        message: `Get project by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async update(id: string, data: ProjectUpdateInput) {
    try {
      const response = await prisma.project.update({
        where: { id },
        data,
        include: {
          labels: true,
        },
      });
      return standardiseResponse({
        message: `Update project with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.project.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete project with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }
}
