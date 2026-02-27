import { prisma, standardiseResponse } from "../utils";

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
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.comment.findMany({
        where: {
          taskLinks: {
            some: {
              taskId,
            },
          },
        },
        include: commentInclude,
      });

      if (!response || response.length === 0) {
        return standardiseResponse({
          message: `No comments found for task ${taskId}`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `List comments for task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comments for task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async getByProjectId(projectId: string) {
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

      const response = await prisma.comment.findMany({
        where: {
          projectLinks: {
            some: {
              projectId,
            },
          },
        },
        include: commentInclude,
      });

      if (!response || response.length === 0) {
        return standardiseResponse({
          message: `No comments found for project ${projectId}`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `List comments for project ${projectId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comments for project ${projectId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: CreateCommentInput) {
    const { content, creatorId, taskId, projectId } = data;

    if (!content || content.trim().length === 0) {
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
          creator: {
            connect: {
              id: creatorId,
            },
          },
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
      return standardiseResponse({
        message: "Error creating comment",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.comment.findUnique({
        where: { id },
        include: commentInclude,
      });

      if (!response) {
        return standardiseResponse({
          message: `Comment with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Get comment by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching comment with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: UpdateCommentInput) {
    const { content, creatorId, taskId, projectId } = data;

    if (!creatorId) {
      return standardiseResponse({
        message: "creatorId is required",
        httpStatus: 400,
      });
    }

    if (content !== undefined && content.trim().length === 0) {
      return standardiseResponse({
        message: "content cannot be empty",
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
        where: { id },
        include: {
          taskLinks: true,
          projectLinks: true,
        },
      });

      if (!existing) {
        return standardiseResponse({
          message: `Comment with ID ${id} not found`,
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
        await tx.commentTask.deleteMany({ where: { commentId: id } });
        await tx.commentProject.deleteMany({ where: { commentId: id } });

        await tx.comment.update({
          where: { id },
          data: {
            ...(content !== undefined ? { content } : {}),
            creatorId,
          },
        });

        if (nextTaskId) {
          await tx.commentTask.create({
            data: {
              commentId: id,
              taskId: nextTaskId,
            },
          });
        }

        if (nextProjectId) {
          await tx.commentProject.create({
            data: {
              commentId: id,
              projectId: nextProjectId,
            },
          });
        }

        return tx.comment.findUnique({
          where: { id },
          include: commentInclude,
        });
      });

      return standardiseResponse({
        message: `Update comment with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating comment with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      const existing = await prisma.comment.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Comment with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.commentTask.deleteMany({ where: { commentId: id } });
        await tx.commentProject.deleteMany({ where: { commentId: id } });
        await tx.comment.delete({ where: { id } });
      });

      return standardiseResponse({
        message: `Delete comment with ID: ${id}`,
        httpStatus: 204,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting comment with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
