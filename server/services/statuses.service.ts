import {
  StatusCreateInput,
  StatusUpdateInput,
} from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class StatusesService {
  async get() {
    try {
      const response = await prisma.status.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No statuses found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all statuses",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching statuses",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: StatusCreateInput) {
    try {
      const response = await prisma.status.create({ data });
      return standardiseResponse({
        message: "Create a status",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating status",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.status.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `Status with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get status by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching status with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: StatusUpdateInput) {
    try {
      const response = await prisma.status.update({ where: { id }, data });
      return standardiseResponse({
        message: `Update status with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating status with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.status.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete status with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting status with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
