import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  prisma,
  standardiseResponse,
} from "../utils";
import { User } from "../prisma/generated/client";
import { StandardResponse } from "../utils/api";

type CreateUserInput = {
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  avatarUrl?: string | null;
  roleId?: string;
};

type UpdateUserInput = {
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  avatarUrl?: string | null;
  roleId?: string;
};

export class UsersService {
  private parseLegacyName(name?: string) {
    const normalized = name?.trim();
    if (!normalized) return { givenName: undefined, familyName: undefined };

    const [first, ...rest] = normalized.split(/\s+/);
    return {
      givenName: first,
      familyName: rest.length > 0 ? rest.join(" ") : first,
    };
  }

  async get(): Promise<StandardResponse<User[]>> {
    try {
      const response = await prisma.user.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse<User[]>({
          message: "No users found",
          httpStatus: 404,
        });
      }
      return standardiseResponse<User[]>({
        message: "List all users",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching users",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: CreateUserInput): Promise<StandardResponse<User>> {
    try {
      const parsedName = this.parseLegacyName(data.name);

      // Normalize string inputs
      const normalizedData: CreateUserInput = {
        ...data,
        name: data.name?.trim(),
        givenName: data.givenName?.trim() ?? parsedName.givenName,
        familyName: data.familyName?.trim() ?? parsedName.familyName,
        email: data.email?.trim(),
      };

      // Validate required fields
      if (!normalizedData.givenName || !normalizedData.familyName) {
        return standardiseResponse({
          message: "User name is required",
          httpStatus: 400,
          error: "name field cannot be empty",
        });
      }

      if (!normalizedData.email || normalizedData.email === "") {
        return standardiseResponse({
          message: "User email is required",
          httpStatus: 400,
          error: "email field cannot be empty",
        });
      }

      // Validate role exists if provided
      if (normalizedData.roleId) {
        const role = await prisma.role.findUnique({
          where: { id: normalizedData.roleId },
        });
        if (!role) {
          return standardiseResponse({
            message: `Role with ID ${normalizedData.roleId} not found`,
            httpStatus: 400,
            error: `Role with ID ${normalizedData.roleId} does not exist`,
          });
        }
      }

      const createData: Parameters<typeof prisma.user.create>[0]["data"] = {
        email: normalizedData.email,
        givenName: normalizedData.givenName,
        familyName: normalizedData.familyName,
        ...(normalizedData.avatarUrl !== undefined
          ? { avatarUrl: normalizedData.avatarUrl }
          : {}),
      };

      const response = await prisma.user.create({ data: createData });
      return standardiseResponse<User>({
        message: "Create a user",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "User with this email already exists",
          httpStatus: 409,
          error: "A user with this email already exists",
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference in user data",
          httpStatus: 400,
          error: "Referenced entity does not exist",
        });
      }
      return standardiseResponse({
        message: "Error creating user",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string): Promise<StandardResponse<User>> {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "User ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      const response = await prisma.user.findUnique({
        where: { id: normalizedId },
      });
      if (!response) {
        return standardiseResponse({
          message: `User with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No user found with ID ${normalizedId}`,
        });
      }
      return standardiseResponse<User>({
        message: `Get user by ID: ${normalizedId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching user with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(
    id: string,
    data: UpdateUserInput,
  ): Promise<StandardResponse<User>> {
    try {
      const parsedName = this.parseLegacyName(data.name);

      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "User ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Normalize string inputs
      const normalizedData: UpdateUserInput = {
        ...data,
        name: data.name?.trim(),
        givenName: data.givenName?.trim() ?? parsedName.givenName,
        familyName: data.familyName?.trim() ?? parsedName.familyName,
        email: data.email?.trim(),
      };

      // Validate name if provided
      if (
        (data.name !== undefined && normalizedData.name === "") ||
        (data.givenName !== undefined && !normalizedData.givenName) ||
        (data.familyName !== undefined && !normalizedData.familyName)
      ) {
        return standardiseResponse({
          message: "User name cannot be empty",
          httpStatus: 400,
          error: "name field cannot be empty string",
        });
      }

      // Validate email if provided
      if (normalizedData.email !== undefined && normalizedData.email === "") {
        return standardiseResponse({
          message: "User email cannot be empty",
          httpStatus: 400,
          error: "email field cannot be empty string",
        });
      }

      // Validate role exists if provided
      if (normalizedData.roleId) {
        const role = await prisma.role.findUnique({
          where: { id: normalizedData.roleId },
        });
        if (!role) {
          return standardiseResponse({
            message: `Role with ID ${normalizedData.roleId} not found`,
            httpStatus: 400,
            error: `Role with ID ${normalizedData.roleId} does not exist`,
          });
        }
      }

      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `User with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No user found with ID ${normalizedId}`,
        });
      }

      const updateData: Parameters<typeof prisma.user.update>[0]["data"] = {
        ...(normalizedData.email !== undefined
          ? { email: normalizedData.email }
          : {}),
        ...(normalizedData.givenName !== undefined
          ? { givenName: normalizedData.givenName }
          : {}),
        ...(normalizedData.familyName !== undefined
          ? { familyName: normalizedData.familyName }
          : {}),
        ...(normalizedData.avatarUrl !== undefined
          ? { avatarUrl: normalizedData.avatarUrl }
          : {}),
      };

      const response = await prisma.user.update({
        where: { id: normalizedId },
        data: updateData,
      });
      return standardiseResponse<User>({
        message: `Update user with ID: ${normalizedId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `User with ID ${id} not found`,
          httpStatus: 404,
          error: `No user found with ID ${id}`,
        });
      }
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "User with this email already exists",
          httpStatus: 409,
          error: "A user with this email already exists",
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference in user data",
          httpStatus: 400,
          error: "Referenced entity does not exist",
        });
      }
      return standardiseResponse({
        message: `Error updating user with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string): Promise<StandardResponse<User>> {
    try {
      // Validate id input
      const normalizedId = id?.trim();
      if (!normalizedId || normalizedId === "") {
        return standardiseResponse({
          message: "User ID is required",
          httpStatus: 400,
          error: "id parameter cannot be empty",
        });
      }

      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id: normalizedId },
      });
      if (!existing) {
        return standardiseResponse({
          message: `User with ID ${normalizedId} not found`,
          httpStatus: 404,
          error: `No user found with ID ${normalizedId}`,
        });
      }

      const response = await prisma.user.delete({
        where: { id: normalizedId },
      });
      return standardiseResponse<User>({
        message: `Delete user with ID: ${normalizedId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `User with ID ${id} not found`,
          httpStatus: 404,
          error: `No user found with ID ${id}`,
        });
      }
      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Cannot delete user with associated records",
          httpStatus: 400,
          error:
            "User has associated tasks, projects, comments, or other records",
        });
      }
      return standardiseResponse({
        message: `Error deleting user with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
