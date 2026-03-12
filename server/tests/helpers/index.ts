import { PrismaClient, User } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

let testPrismaClient: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!testPrismaClient) {
    testPrismaClient = createPrismaClient();
  }
  return testPrismaClient;
}

export type CreateTestUserInput = {
  email?: string;
  givenName?: string;
  familyName?: string;
  avatarUrl?: string | null;
};

export async function createTestUser(
  input: CreateTestUserInput = {},
): Promise<User> {
  const prisma = getTestPrisma();

  const defaultUser = {
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    givenName: "Test",
    familyName: "User",
    avatarUrl: null,
  };

  const userData = {
    ...defaultUser,
    ...input,
  };

  return await prisma.user.create({
    data: userData,
  });
}

export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();

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
      // Table might not exist
    }
  }
}
