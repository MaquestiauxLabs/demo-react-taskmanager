import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  prisma,
  standardiseResponse,
} from "../utils";

type CreateCommentInput = {
  content?: string;
  creatorId?: string;
  taskId?: string;
  projectId?: string;
};

type UpdateCommentInput = {
  content?: string;
  creatorId?: string;
  taskId?: string;
  projectId?: string;
};

const commentInclude = {
  creator: true,
  taskLinks: {
    include: {
      task: true,
    },
  },
  projectLinks: {
    include: {
      project: true,
    },
  },
};

export class CommentsService {
  async getByTaskId(taskId: string) {
    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      return standardiseResponse({
        message: "taskId is required",
        httpStatus: 400,
      });
    }

    try {
      const task = await prisma.task.findUnique({
        where: { id: normalizedTaskId },
      });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${normalizedTaskId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.comment.findMany({
        where: {
          taskLinks: {
            some: {
              taskId: normalizedTaskId,
            },
          },
        },
        include: commentInclude,
      });

      if (!response || response.length === 0) {
        return standardiseResponse({
          message: `No comments found for task ${normalizedTaskId}`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `List comments for task ${normalizedTaskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comments for task ${normalizedTaskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async getByProjectId(projectId: string) {
    const normalizedProjectId = projectId.trim();

    if (!normalizedProjectId) {
      return standardiseResponse({
        message: "projectId is required",
        httpStatus: 400,
      });
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: normalizedProjectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${normalizedProjectId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.comment.findMany({
        where: {
          projectLinks: {
            some: {
              projectId: normalizedProjectId,
            },
          },
        },
        include: commentInclude,
      });

      if (!response || response.length === 0) {
        return standardiseResponse({
          message: `No comments found for project ${normalizedProjectId}`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `List comments for project ${normalizedProjectId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comments for project ${normalizedProjectId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: CreateCommentInput) {
    const content = data.content?.trim();
    const creatorId = data.creatorId?.trim();
    const taskId = data.taskId?.trim();
    const projectId = data.projectId?.trim();

    if (!content) {
      return standardiseResponse({
        message: "content is required",
        httpStatus: 400,
      });
    }

    if (!creatorId) {
      return standardiseResponse({
        message: "creatorId is required",
        httpStatus: 400,
      });
    }

    if (data.taskId !== undefined && !taskId) {
      return standardiseResponse({
        message: "taskId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.projectId !== undefined && !projectId) {
      return standardiseResponse({
        message: "projectId cannot be empty",
        httpStatus: 400,
      });
    }

    if ((taskId && projectId) || (!taskId && !projectId)) {
      return standardiseResponse({
        message: "Exactly one target is required: taskId or projectId",
        httpStatus: 400,
      });
    }

    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });
      if (!creator) {
        return standardiseResponse({
          message: `User with ID ${creatorId} not found`,
          httpStatus: 404,
        });
      }

      if (taskId) {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
          return standardiseResponse({
            message: `Task with ID ${taskId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          return standardiseResponse({
            message: `Project with ID ${projectId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.comment.create({
        data: {
          content,
          creatorId,
          ...(taskId
            ? {
                taskLinks: {
                  create: {
                    task: {
                      connect: {
                        id: taskId,
                      },
                    },
                  },
                },
              }
            : {
                projectLinks: {
                  create: {
                    project: {
                      connect: {
                        id: projectId,
                      },
                    },
                  },
                },
              }),
        },
        include: commentInclude,
      });

      return standardiseResponse({
        message: "Create a comment",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Comment already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while creating comment",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: "Error creating comment",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return standardiseResponse({
        message: "id is required",
        httpStatus: 400,
      });
    }

    try {
      const response = await prisma.comment.findUnique({
        where: { id: normalizedId },
        include: commentInclude,
      });

      if (!response) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Get comment by ID: ${normalizedId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comment with ID ${normalizedId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: UpdateCommentInput) {
    const normalizedId = id.trim();
    const content = data.content?.trim();
    const creatorId = data.creatorId?.trim();
    const taskId = data.taskId?.trim();
    const projectId = data.projectId?.trim();

    if (!normalizedId) {
      return standardiseResponse({
        message: "id is required",
        httpStatus: 400,
      });
    }

    if (!creatorId) {
      return standardiseResponse({
        message: "creatorId is required",
        httpStatus: 400,
      });
    }

    if (data.content !== undefined && !content) {
      return standardiseResponse({
        message: "content cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.taskId !== undefined && !taskId) {
      return standardiseResponse({
        message: "taskId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.projectId !== undefined && !projectId) {
      return standardiseResponse({
        message: "projectId cannot be empty",
        httpStatus: 400,
      });
    }

    if (taskId && projectId) {
      return standardiseResponse({
        message: "Exactly one target is required: taskId or projectId",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.comment.findUnique({
        where: { id: normalizedId },
        include: {
          taskLinks: true,
          projectLinks: true,
        },
      });

      if (!existing) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });
      if (!creator) {
        return standardiseResponse({
          message: `User with ID ${creatorId} not found`,
          httpStatus: 404,
        });
      }

      const existingTaskId = existing.taskLinks[0]?.taskId;
      const existingProjectId = existing.projectLinks[0]?.projectId;

      const nextTaskId = taskId ?? (projectId ? undefined : existingTaskId);
      const nextProjectId =
        projectId ?? (taskId ? undefined : existingProjectId);

      if ((nextTaskId && nextProjectId) || (!nextTaskId && !nextProjectId)) {
        return standardiseResponse({
          message: "Exactly one target is required: taskId or projectId",
          httpStatus: 400,
        });
      }

      if (nextTaskId) {
        const task = await prisma.task.findUnique({
          where: { id: nextTaskId },
        });
        if (!task) {
          return standardiseResponse({
            message: `Task with ID ${nextTaskId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (nextProjectId) {
        const project = await prisma.project.findUnique({
          where: { id: nextProjectId },
        });
        if (!project) {
          return standardiseResponse({
            message: `Project with ID ${nextProjectId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.$transaction(async (tx) => {
        await tx.commentTask.deleteMany({ where: { commentId: normalizedId } });
        await tx.commentProject.deleteMany({
          where: { commentId: normalizedId },
        });

        await tx.comment.update({
          where: { id: normalizedId },
          data: {
            ...(content !== undefined ? { content } : {}),
            creatorId,
          },
        });

        if (nextTaskId) {
          await tx.commentTask.create({
            data: {
              commentId: normalizedId,
              taskId: nextTaskId,
            },
          });
        }

        if (nextProjectId) {
          await tx.commentProject.create({
            data: {
              commentId: normalizedId,
              projectId: nextProjectId,
            },
          });
        }

        return tx.comment.findUnique({
          where: { id: normalizedId },
          include: commentInclude,
        });
      });

      if (!response) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Update comment with ID: ${normalizedId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Comment already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while updating comment",
          httpStatus: 400,
        });
      }

      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error updating comment with ID ${normalizedId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      return standardiseResponse({
        message: "id is required",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.comment.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.commentTask.deleteMany({ where: { commentId: normalizedId } });
        await tx.commentProject.deleteMany({
          where: { commentId: normalizedId },
        });
        await tx.comment.delete({ where: { id: normalizedId } });
      });

      return standardiseResponse({
        message: `Delete comment with ID: ${normalizedId}`,
        httpStatus: 200,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Comment with ID ${normalizedId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error deleting comment with ID ${normalizedId}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
