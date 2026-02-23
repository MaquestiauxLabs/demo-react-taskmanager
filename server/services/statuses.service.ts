import {
  StatusCreateInput,
  StatusUpdateInput,
} from "../prisma/generated/models";
import { prisma } from "../utils";

export class StatusesService {
  async get() {
    try {
      const response = await prisma.status.findMany();
      if (!response || response.length === 0) {
        return { message: "No statuses found", httpStatus: 404 };
      }
      return { message: "List all statuses", httpStatus: 200, data: response };
    } catch (error) {
      return { message: "Error fetching statuses", httpStatus: 500, error };
    }
  }

  async create(data: StatusCreateInput) {
    try {
      const response = await prisma.status.create({ data });
      return { message: "Create a status", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating status", httpStatus: 500, error };
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.status.findUnique({ where: { id } });
      if (!response) {
        return { message: `Status with ID ${id} not found`, httpStatus: 404 };
      }
      return {
        message: `Get status by ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error fetching status with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async update(id: string, data: StatusUpdateInput) {
    try {
      const response = await prisma.status.update({ where: { id }, data });
      return {
        message: `Update status with ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error updating status with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      await prisma.status.delete({ where: { id } });
      return { message: `Delete status with ID: ${id}`, httpStatus: 200 };
    } catch (error) {
      return {
        message: `Error deleting status with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }
}
