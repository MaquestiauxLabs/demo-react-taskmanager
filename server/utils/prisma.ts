import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../prisma/generated/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as {
  __testPrisma?: PrismaClient;
};

export const testPrisma = globalForPrisma.__testPrisma || prisma;

export { prisma };
