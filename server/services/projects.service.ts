import {
  ProjectCreateInput,
  ProjectUpdateInput,
} from "../prisma/generated/models";
import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
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
      // Normalize string inputs
      const normalizedData: ProjectCreateInput = {
        ...data,
        name: data.name?.trim(),
        description: data.description?.trim(),
      };

      // Validate required fields
      if (!normalizedData.name || normalizedData.name === "") {
        return standardiseResponse({
          message: "Project name is required",
          httpStatus: 400,
          error: "name field cannot be empty",
        });
      }

      // Validate creator exists
      if (normalizedData.creatorId) {
        const creator = await prisma.user.findUnique({
          where: { id: normalizedData.creatorId },
        });
        if (!creator) {
          return standardiseResponse({
            message: `Creator with ID ${normalizedData.creatorId} not found`,
            httpStatus: 400,
            error: `User with ID ${normalizedData.creatorId} does not exist`,
          });
        }
      }

      const response = await prisma.project.create({
        data: normalizedData,
        include: projectInclude,
      });
      return standardiseResponse({
        message: "Create a project",
        httpStatus: 201,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Project with this name already exists",
          httpStatus: 409,
          error: "A project with this name already exists",
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference in project data",
          httpStatus: 400,
          error: "Referenced entity does not exist",
        });
      }
      return standardiseResponse({
        message: "Error creating project",
        httpStatus: 500,
        error: error,
      });
    }
  }

  async getById(id: string) {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      const response = await prisma.project.findUnique({
        where: { id: normalizedId },
        include: projectInclude,
      });
      if (!response) {
        return standardiseResponse({
          message: `Project with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedId} in the database`,
        });
      }
      return standardiseResponse({
        message: `Get project by ID: ${normalizedId}`,
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
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Normalize string inputs
      const normalizedData: ProjectUpdateInput = {
        ...data,
        name: data.name?.trim(),
        description: data.description?.trim(),
      };

      // Validate name if provided
      if (normalizedData.name !== undefined && normalizedData.name === "") {
        return standardiseResponse({
          message: "Project name cannot be empty",
          httpStatus: 400,
          error: "name field cannot be empty string",
        });
      }

      // Check if project exists
      const existing = await prisma.project.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `Project with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedId}`,
        });
      }

      const response = await prisma.project.update({
        where: { id: normalizedId },
        data: normalizedData,
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Update project with ID: ${normalizedId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${id} not found`,
          httpStatus: 404,
          error: `No project found with ID ${id}`,
        });
      }
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Project with this name already exists",
          httpStatus: 409,
          error: "A project with this name already exists",
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference in project data",
          httpStatus: 400,
          error: "Referenced entity does not exist",
        });
      }
      return standardiseResponse({
        message: `Error updating project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async delete(id: string) {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Check if project exists
      const existing = await prisma.project.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `Project with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedId}`,
        });
      }

      await prisma.project.delete({ where: { id: normalizedId } });
      return standardiseResponse({
        message: `Delete project with ID: ${normalizedId}`,
        httpStatus: 200,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${id} not found`,
          httpStatus: 404,
          error: `No project found with ID ${id}`,
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Cannot delete project with associated records",
          httpStatus: 400,
          error: "Project has associated tasks, comments, or other records",
        });
      }
      return standardiseResponse({
        message: `Error deleting project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async archive(id: string) {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Check if project exists
      const existing = await prisma.project.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `Project with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedId}`,
        });
      }

      const response = await prisma.project.update({
        where: { id: normalizedId },
        data: { isArchived: true },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Archive project with ID: ${normalizedId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${id} not found`,
          httpStatus: 404,
          error: `No project found with ID ${id}`,
        });
      }
      return standardiseResponse({
        message: `Error archiving project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async unarchive(id: string) {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Check if project exists
      const existing = await prisma.project.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `Project with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedId}`,
        });
      }

      const response = await prisma.project.update({
        where: { id: normalizedId },
        data: { isArchived: false },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Unarchive project with ID: ${normalizedId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${id} not found`,
          httpStatus: 404,
          error: `No project found with ID ${id}`,
        });
      }
      return standardiseResponse({
        message: `Error unarchiving project with ID ${id}`,
        httpStatus: 500,
        error: error,
      });
    }
  }

  async assignUser(projectId: string, userId: string) {
    try {
      // Validate inputs
      const normalizedProjectId = projectId?.trim();
      const normalizedUserId = userId?.trim();

      if (!normalizedProjectId || normalizedProjectId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "projectId parameter cannot be empty",
        });
      }

      if (!normalizedUserId || normalizedUserId === "") {
        return standardiseResponse({
          message: "User ID is required",
          httpStatus: 400,
          error: "userId parameter cannot be empty",
        });
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: normalizedProjectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${normalizedProjectId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedProjectId}`,
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
          error: `No user found with ID ${normalizedUserId}`,
        });
      }

      const response = await prisma.project.update({
        where: { id: normalizedProjectId },
        data: {
          assignees: {
            connect: {
              userId_projectId: {
                userId: normalizedUserId,
                projectId: normalizedProjectId,
              },
            },
          },
        },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Assign user ${normalizedUserId} to project ${normalizedProjectId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${projectId}`,
        });
      }
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "User is already assigned to this project",
          httpStatus: 409,
          error: "This user is already assigned to this project",
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid user or project reference",
          httpStatus: 400,
          error: "Referenced user or project does not exist",
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
      // Validate inputs
      const normalizedProjectId = projectId?.trim();
      const normalizedUserId = userId?.trim();

      if (!normalizedProjectId || normalizedProjectId === "") {
        return standardiseResponse({
          message: "Project ID is required",
          httpStatus: 400,
          error: "projectId parameter cannot be empty",
        });
      }

      if (!normalizedUserId || normalizedUserId === "") {
        return standardiseResponse({
          message: "User ID is required",
          httpStatus: 400,
          error: "userId parameter cannot be empty",
        });
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: normalizedProjectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${normalizedProjectId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${normalizedProjectId}`,
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
          error: `No user found with ID ${normalizedUserId}`,
        });
      }

      const response = await prisma.project.update({
        where: { id: normalizedProjectId },
        data: {
          assignees: {
            disconnect: {
              userId_projectId: {
                userId: normalizedUserId,
                projectId: normalizedProjectId,
              },
            },
          },
        },
        include: projectInclude,
      });
      return standardiseResponse({
        message: `Unassign user ${normalizedUserId} from project ${normalizedProjectId}`,
        httpStatus: 200,
        data: normalizeWithLabelsAndComments(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Project with ID ${projectId} not found`,
          httpStatus: 404,
          error: `No project found with ID ${projectId}`,
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid user or project reference",
          httpStatus: 400,
          error: "Referenced user or project does not exist",
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
