import { UserCreateInput, UserUpdateInput } from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

export class UsersService {
  async get() {
    try {
      const response = await prisma.user.findMany();
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No users found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
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

  async create(data: UserCreateInput) {
    try {
      const response = await prisma.user.create({ data });
      return standardiseResponse({
        message: "Create a user",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating user",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.user.findUnique({ where: { id } });
      if (!response) {
        return standardiseResponse({
          message: `User with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get user by ID: ${id}`,
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

  async update(id: string, data: UserUpdateInput) {
    try {
      const response = await prisma.user.update({ where: { id }, data });
      return standardiseResponse({
        message: `Update user with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return {
        message: `Error updating user with ID ${id}`,
        httpStatus: 500,
        error,
      };
    }
  }

  async delete(id: string) {
    try {
      const response = await prisma.user.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete user with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting user with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
