import { TaskCreateInput, TaskUpdateInput } from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class TasksService {
  async get() {
    try {
      const response = await prisma.task.findMany({
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No tasks found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all tasks",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching tasks",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: TaskCreateInput) {
    try {
      const response = await prisma.task.create({
        data,
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: "Create a task",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating task",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.task.findUnique({
        where: { id },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      if (!response) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get task by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: TaskUpdateInput) {
    try {
      const response = await prisma.task.update({
        where: { id },
        data,
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Update task with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.task.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete task with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async addLabels(taskId: string, labelIds: string[]) {
    try {
      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          labels: {
            connect: labelIds.map((id) => ({ id })),
          },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Add labels to task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error adding labels to task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async removeLabels(taskId: string, labelIds: string[]) {
    try {
      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          labels: {
            disconnect: labelIds.map((id) => ({ id })),
          },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Remove labels from task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error removing labels from task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async setPriority(taskId: string, priorityId: string | null) {
    try {
      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          priority: priorityId
            ? { connect: { id: priorityId } }
            : { disconnect: true },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Set priority for task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error setting priority for task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async setStatus(taskId: string, statusId: string | null) {
    try {
      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: statusId
            ? { connect: { id: statusId } }
            : { disconnect: true },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Set status for task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error setting status for task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async assignProject(taskId: string, projectId: string) {
    try {
      if (!projectId) {
        return standardiseResponse({
          message: "projectId is required",
          httpStatus: 400,
        });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
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

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          project: {
            connect: { id: projectId },
          },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Assign project ${projectId} to task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error assigning project ${projectId} to task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unassignProject(taskId: string) {
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          project: {
            disconnect: true,
          },
        },
        include: {
          labels: true,
          priority: true,
          status: true,
          commentLinks: {
            include: {
              comment: true,
            },
          },
        },
      });
      return standardiseResponse({
        message: `Unassign project from task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unassigning project from task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
