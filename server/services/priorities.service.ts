import {
  PriorityCreateInput,
  PriorityUpdateInput,
} from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class PrioritiesService {
  async get() {
    try {
      const response = await prisma.priority.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No priorities found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all priorities",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching priorities",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: PriorityCreateInput) {
    try {
      const response = await prisma.priority.create({ data });
      return standardiseResponse({
        message: "Create a priority",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating priority",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.priority.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `Priority with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get priority by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching priority with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: PriorityUpdateInput) {
    try {
      const response = await prisma.priority.update({ where: { id }, data });
      return standardiseResponse({
        message: `Update priority with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating priority with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.priority.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete priority with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting priority with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
