import { Role } from "../prisma/generated/client";
import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  prisma,
  standardiseResponse,
} from "../utils";
import { StandardResponse } from "../utils/api";

type CreateRoleInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

type UpdateRoleInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

const isHexColor = (value: string): boolean => {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

export class RolesService {
  async get(): Promise<StandardResponse<Role[]>> {
    try {
      const response = await prisma.role.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse<Role[]>({
          message: "No roles found",
          httpStatus: 404,
        });
      }
      return standardiseResponse<Role[]>({
        message: "List all roles",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse<Role[]>({
        message: "Error fetching roles",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: CreateRoleInput): Promise<StandardResponse<Role>> {
    const name = data.name?.trim();
    const color = data.color?.trim();
    const creatorId = data.creatorId?.trim();

    if (!name) {
      return standardiseResponse({
        message: "name is required",
        httpStatus: 400,
      });
    }

    if (!color) {
      return standardiseResponse({
        message: "color is required",
        httpStatus: 400,
      });
    }

    if (!isHexColor(color)) {
      return standardiseResponse({
        message: "color must be a valid hex code",
        httpStatus: 400,
      });
    }

    if (!creatorId) {
      return standardiseResponse({
        message: "creatorId is required",
        httpStatus: 400,
      });
    }

    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!creator) {
        return standardiseResponse({
          message: `User with ID ${creatorId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.role.create({
        data: {
          name,
          color,
          creatorId,
        },
      });
      return standardiseResponse<Role>({
        message: "Create a role",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Role already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while creating role",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: "Error creating role",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string): Promise<StandardResponse<Role>> {
    try {
      const response = await prisma.role.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `Role with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse<Role>({
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

  async update(
    id: string,
    data: UpdateRoleInput,
  ): Promise<StandardResponse<Role>> {
    const name = data.name?.trim();
    const color = data.color?.trim();
    const creatorId = data.creatorId?.trim();

    if (data.name !== undefined && !name) {
      return standardiseResponse({
        message: "name cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.color !== undefined && !color) {
      return standardiseResponse({
        message: "color cannot be empty",
        httpStatus: 400,
      });
    }

    if (color && !isHexColor(color)) {
      return standardiseResponse({
        message: "color must be a valid hex code",
        httpStatus: 400,
      });
    }

    if (data.creatorId !== undefined && !creatorId) {
      return standardiseResponse({
        message: "creatorId cannot be empty",
        httpStatus: 400,
      });
    }

    if (name === undefined && color === undefined && creatorId === undefined) {
      return standardiseResponse({
        message: "At least one field is required to update a role",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.role.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Role with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      if (creatorId) {
        const creator = await prisma.user.findUnique({
          where: { id: creatorId },
        });
        if (!creator) {
          return standardiseResponse({
            message: `User with ID ${creatorId} not found`,
            httpStatus: 404,
          });
        }
      }

      const updateData = {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(creatorId !== undefined ? { creatorId } : {}),
      };

      const response = await prisma.role.update({
        where: { id },
        data: updateData,
      });
      return standardiseResponse<Role>({
        message: `Update role with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Role already exists",
          httpStatus: 409,
        });
      }

      return standardiseResponse({
        message: `Error updating role with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string): Promise<StandardResponse<Role>> {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "Role ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Check if role exists
      const existing = await prisma.role.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Role with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.role.delete({ where: { id } });
      return standardiseResponse<Role>({
        message: `Delete role with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Role with ID ${id} not found`,
          httpStatus: 404,
          error: `No role found with ID ${id}`,
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Cannot delete role with associated records",
          httpStatus: 400,
          error: "Role has associated users, or other records",
        });
      }
      return standardiseResponse({
        message: `Error deleting role with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
