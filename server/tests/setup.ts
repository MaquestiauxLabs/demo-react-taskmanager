import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, afterEach, beforeAll } from "vitest";
import { PrismaClient } from "../prisma/generated/client";

let prismaClient: PrismaClient;

const connectionString = `${process.env.DATABASE_URL}`;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function cleanTables(prisma: PrismaClient) {
  const tableNames = ["Role", "User"];

  for (const table of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Table might not exist or have constraints
    }
  }
}

beforeAll(async () => {
  prismaClient = createPrismaClient();
  await prismaClient.$connect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__testPrisma = prismaClient;
});

afterAll(async () => {
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
});

afterEach(async () => {
  if (prismaClient) {
    await cleanTables(prismaClient);
  }
});

export function getPrisma() {
  return prismaClient;
}
