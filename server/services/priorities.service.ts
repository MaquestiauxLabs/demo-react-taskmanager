import {
  PriorityCreateInput,
  PriorityUpdateInput,
} from "../prisma/generated/models";
import { prisma } from "../utils";

export class PrioritiesService {
  async get() {
    try {
      const response = await prisma.priority.findMany();
      if (!response || response.length === 0) {
        return { message: "No priorities found", httpStatus: 404 };
      }
      return {
        message: "List all priorities",
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return { message: "Error fetching priorities", httpStatus: 500, error };
    }
  }

  async create(data: PriorityCreateInput) {
    try {
      const response = await prisma.priority.create({ data });
      return { message: "Create a priority", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating priority", httpStatus: 500, error };
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.priority.findUnique({ where: { id } });
      if (!response) {
        return { message: `Priority with ID ${id} not found`, httpStatus: 404 };
      }
      return {
        message: `Get priority by ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error fetching priority with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async update(id: string, data: PriorityUpdateInput) {
    try {
      const response = await prisma.priority.update({ where: { id }, data });
      return {
        message: `Update priority with ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error updating priority with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      await prisma.priority.delete({ where: { id } });
      return { message: `Delete priority with ID: ${id}`, httpStatus: 200 };
    } catch (error) {
      return {
        message: `Error deleting priority with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }
}
