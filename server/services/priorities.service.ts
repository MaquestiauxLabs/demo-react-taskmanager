import { Priority } from "../prisma/generated/client";
import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  prisma,
  standardiseResponse,
} from "../utils";
import { StandardResponse } from "../utils/api";

type CreatePriorityInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

type UpdatePriorityInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

const isHexColor = (value: string): boolean => {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

export class PrioritiesService {
  async get(): Promise<StandardResponse<Priority[] | null>> {
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

  async create(
    data: CreatePriorityInput,
  ): Promise<StandardResponse<Priority | null>> {
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

      const response = await prisma.priority.create({
        data: {
          name,
          color,
          creatorId,
        },
      });

      return standardiseResponse({
        message: "Create a priority",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Priority already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while creating priority",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: "Error creating priority",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string): Promise<StandardResponse<Priority | null>> {
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

  async update(
    id: string,
    data: UpdatePriorityInput,
  ): Promise<StandardResponse<Priority | null>> {
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
        message: "At least one field is required to update a priority",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.priority.findUnique({
        where: { id },
      });

      if (!existing) {
        return standardiseResponse({
          message: `Priority with ID ${id} not found`,
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

      const response = await prisma.priority.update({
        where: { id },
        data: updateData,
      });
      return standardiseResponse({
        message: `Update priority with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Priority already exists",
          httpStatus: 409,
        });
      }

      return standardiseResponse({
        message: `Error updating priority with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string): Promise<StandardResponse<Priority | null>> {
    try {
      const existing = await prisma.priority.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Priority with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.priority.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete priority with ID: ${id}`,
        httpStatus: 200,
        data: response,
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
