import { LabelCreateInput, LabelUpdateInput } from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class LabelsService {
  async get() {
    try {
      const response = await prisma.label.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No labels found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all labels",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching labels",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: LabelCreateInput) {
    try {
      const response = await prisma.label.create({ data });
      return standardiseResponse({
        message: "Create a label",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating label",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.label.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `Label with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get label by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching label with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: LabelUpdateInput) {
    try {
      const response = await prisma.label.update({ where: { id }, data });
      return standardiseResponse({
        message: `Update label with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating label with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.label.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete label with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting label with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
