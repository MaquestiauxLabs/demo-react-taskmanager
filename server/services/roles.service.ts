import { RoleCreateInput, RoleUpdateInput } from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class RolesService {
  async get() {
    try {
      const response = await prisma.role.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No roles found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all roles",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching roles",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: RoleCreateInput) {
    try {
      const response = await prisma.role.create({ data });
      return standardiseResponse({
        message: "Create a role",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating role",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.role.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `Role with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get role by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching role with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: RoleUpdateInput) {
    try {
      const response = await prisma.role.update({ where: { id }, data });
      return standardiseResponse({
        message: `Update role with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating role with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      await prisma.role.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete role with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting role with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
