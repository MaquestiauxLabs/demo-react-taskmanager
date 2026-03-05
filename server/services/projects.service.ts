import {
  ProjectCreateInput,
  ProjectUpdateInput,
} from "../prisma/generated/models";
import {
  normalizeManyWithLabelsAndComments,
  normalizeWithLabelsAndComments,
  prisma,
  standardiseResponse,
} from "../utils";

const projectInclude = {
  labelLinks: {
    include: {
      label: true,
    },
  },
  commentLinks: {
    include: {
      comment: true,
    },
  },
};

export class ProjectsService {
  async get() {
    try {
      const response = await prisma.project.findMany({
        include: projectInclude,
        where: { isArchived: false },
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
        data: normalizeManyWithLabelsAndComments(response),
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
        include: projectInclude,
      });
      return standardiseResponse({
        message: "Create a project",
        httpStatus: 201,
        data: normalizeWithLabelsAndComments(response),
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
        include: projectInclude,
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
        data: normalizeWithLabelsAndComments(response),
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
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Update project with ID: ${id}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
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

  async archive(id: string) {
    try {
      const response = await prisma.project.update({
        where: { id },
        data: { isArchived: true },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Archive project with ID: ${id}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error archiving project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async unarchive(id: string) {
    try {
      const response = await prisma.project.update({
        where: { id },
        data: { isArchived: false },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Unarchive project with ID: ${id}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error unarchiving project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async assignUser(projectId: string, userId: string) {
    try {
      if (!userId) {
        return standardiseResponse({
          message: "userId is required",
          httpStatus: 400,
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${userId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.project.update({
        where: { id: projectId },
        data: {
          assignees: {
            connect: { userId_projectId: { userId, projectId } },
          },
        },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Assign user ${userId} to project ${projectId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error assigning user ${userId} to project ${projectId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unassignUser(projectId: string, userId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${userId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.project.update({
        where: { id: projectId },
        data: {
          assignees: {
            disconnect: { userId_projectId: { userId, projectId } },
          },
        },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Unassign user ${userId} from project ${projectId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unassigning user ${userId} from project ${projectId}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
