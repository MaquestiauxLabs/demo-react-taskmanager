import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client";
import { beforeAll, afterAll, afterEach } from "vitest";

let prismaClient: PrismaClient;

const connectionString = `${process.env.DATABASE_URL}`;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function cleanTables(prisma: PrismaClient) {
  const tableNames = [
    "TaskWatcher",
    "UserTask",
    "UserProject",
    "CommentTask",
    "TaskLabel",
    "TimeEntry",
    "Comment",
    "Task",
    "Project",
    "Label",
    "Status",
    "Priority",
    "Role",
    "User",
  ];

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
