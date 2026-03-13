import { Status } from "../prisma/generated/client";
import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  prisma,
  standardiseResponse,
} from "../utils";
import { StandardResponse } from "../utils/api";

type CreateStatusInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

type UpdateStatusInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

const isHexColor = (value: string): boolean => {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

export class StatusesService {
  async get(): Promise<StandardResponse<Status[] | null>> {
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

  async create(
    data: CreateStatusInput,
  ): Promise<StandardResponse<Status | null>> {
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

      const response = await prisma.status.create({
        data: {
          name,
          color,
          creatorId,
        },
      });
      return standardiseResponse({
        message: "Create a status",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Status already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while creating status",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: "Error creating status",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string): Promise<StandardResponse<Status | null>> {
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

  async update(
    id: string,
    data: UpdateStatusInput,
  ): Promise<StandardResponse<Status | null>> {
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
        message: "At least one field is required to update a status",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.status.findUnique({
        where: { id },
      });

      if (!existing) {
        return standardiseResponse({
          message: `Status with ID ${id} not found`,
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

      const response = await prisma.status.update({
        where: { id },
        data: updateData,
      });
      return standardiseResponse({
        message: `Update status with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Status already exists",
          httpStatus: 409,
        });
      }

      return standardiseResponse({
        message: `Error updating status with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string): Promise<StandardResponse<Status | null>> {
    try {
      const existing = await prisma.status.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Status with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.status.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete status with ID: ${id}`,
        httpStatus: 200,
        data: response,
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
