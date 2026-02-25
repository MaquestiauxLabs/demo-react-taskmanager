import {
  ProjectCreateInput,
  ProjectUpdateInput,
} from "../prisma/generated/models";
import { prisma } from "../utils";

export class ProjectsService {
  async get() {
    try {
      const response = await prisma.project.findMany({
        include: {
          labels: true,
        },
      });
      if (!response || response.length === 0) {
        return { message: "No projects found", httpStatus: 404 };
      }
      return { message: "List all projects", httpStatus: 200, data: response };
    } catch (error) {
      return { message: "Error fetching projects", httpStatus: 500, error };
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
      return { message: "Create a project", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating project", httpStatus: 500, error };
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
        return { message: `Project with ID ${id} not found`, httpStatus: 404 };
      }
      return {
        message: `Get project by ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error fetching project with ID ${id}`,
        httpStatus: 500,
        error,
      };
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
      return {
        message: `Update project with ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error updating project with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      await prisma.project.delete({ where: { id } });
      return { message: `Delete project with ID: ${id}`, httpStatus: 200 };
    } catch (error) {
      return {
        message: `Error deleting project with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }
}
