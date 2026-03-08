import { Prisma } from "../prisma/generated/client";

const isKnownRequestError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

export const isPrismaNotFoundError = (error: unknown): boolean => {
  return isKnownRequestError(error) && error.code === "P2025";
};

export const isPrismaConflictError = (error: unknown): boolean => {
  return isKnownRequestError(error) && error.code === "P2002";
};

export const isPrismaForeignKeyError = (error: unknown): boolean => {
  return isKnownRequestError(error) && error.code === "P2003";
};
