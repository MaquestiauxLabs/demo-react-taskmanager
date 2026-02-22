import { LabelCreateInput, LabelUpdateInput } from "../prisma/generated/models";
import { prisma } from "../utils";

export class LabelsService {
  async get() {
    try {
      const response = await prisma.label.findMany();
      if (!response || response.length === 0) {
        return { message: "No labels found", httpStatus: 404 };
      }
      return { message: "List all labels", httpStatus: 200, data: response };
    } catch (error) {
      return { message: "Error fetching labels", httpStatus: 500, error };
    }
  }

  async create(data: LabelCreateInput) {
    try {
      const response = await prisma.label.create({ data });
      return { message: "Create a label", httpStatus: 201, data: response };
    } catch (error) {
      return { message: "Error creating label", httpStatus: 500, error };
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.label.findUnique({ where: { id } });
      if (!response) {
        return { message: `Label with ID ${id} not found`, httpStatus: 404 };
      }
      return {
        message: `Get label by ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error fetching label with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async update(id: string, data: LabelUpdateInput) {
    try {
      const response = await prisma.label.update({ where: { id }, data });
      return {
        message: `Update label with ID: ${id}`,
        httpStatus: 200,
        data: response,
      };
    } catch (error) {
      return {
        message: `Error updating label with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      await prisma.label.delete({ where: { id } });
      return { message: `Delete label with ID: ${id}`, httpStatus: 200 };
    } catch (error) {
      return {
        message: `Error deleting label with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }
}
