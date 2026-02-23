import { TaskCreateInput, TaskUpdateInput } from "../prisma/generated/models";
import { prisma } from "../utils";

export class TasksService {
  async get() {
    try {
      const response = await prisma.task.findMany({
        include: {
          labels: true,
          priority: true,
          status: true,
        },
      });
      if (!response || response.length === 0) {
        return { message: "No tasks found", httpStatus: 404 };
      }
      return { message: "List all tasks", httpStatus: 200, data: response };
    } catch (error) {
      return { message: "Error fetching tasks", httpStatus: 500, error };
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
        },
      });
      return { message: "Create a task", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating task", httpStatus: 500, error };
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
        },
      });
      if (!response) {
        return { message: `Task with ID ${id} not found`, httpStatus: 404 };
      }
      return {
        message: `Get task by ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error fetching task with ID ${id}`,
        httpStatus: 500,
        error,
      };
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
        },
      });
      return {
        message: `Update task with ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error updating task with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      await prisma.task.delete({ where: { id } });
      return { message: `Delete task with ID: ${id}`, httpStatus: 200 };
    } catch (error) {
      return {
        message: `Error deleting task with ID ${id}`,
        httpStatus: 500,
        error,
      };
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
        },
      });
      return {
        message: `Add labels to task ${taskId}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error adding labels to task ${taskId}`,
        httpStatus: 500,
        error,
      };
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
        },
      });
      return {
        message: `Remove labels from task ${taskId}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error removing labels from task ${taskId}`,
        httpStatus: 500,
        error,
      };
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
        },
      });
      return {
        message: `Set priority for task ${taskId}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error setting priority for task ${taskId}`,
        httpStatus: 500,
        error,
      };
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
        },
      });
      return {
        message: `Set status for task ${taskId}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error setting status for task ${taskId}`,
        httpStatus: 500,
        error,
      };
    }
  }
}
