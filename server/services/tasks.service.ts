import { TaskCreateInput, TaskUpdateInput } from "../prisma/generated/models";
import { prisma } from "../utils";

export class TasksService {
  async get() {
    try {
      const response = await prisma.task.findMany();
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
      const response = await prisma.task.create({ data });
      return { message: "Create a task", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating task", httpStatus: 500, error };
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.task.findUnique({ where: { id } });
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
      const response = await prisma.task.update({ where: { id }, data });
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
}
