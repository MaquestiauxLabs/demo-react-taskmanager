import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Priority,
  Role,
  User,
} from "../../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  __testPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

let testPrismaClient: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (!testPrismaClient) {
    testPrismaClient = globalForPrisma.__testPrisma || createPrismaClient();
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

export type CreateTestRoleInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

export async function createTestRole(
  input: CreateTestRoleInput = {},
): Promise<Role> {
  const prisma = getTestPrisma();

  const defaultRole = {
    name: `Role-${Date.now()}-${Math.random()}`,
    color: "#FF5733",
  };

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  const roleData = {
    ...defaultRole,
    ...input,
    creatorId,
  };

  return await prisma.role.create({
    data: roleData,
  });
}

export type CreateTestPriorityInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

export async function createTestPriority(
  input: CreateTestPriorityInput = {},
): Promise<Priority> {
  const prisma = getTestPrisma();

  const defaultPriority = {
    name: `Priority-${Date.now()}-${Math.random()}`,
    color: "#FF5733",
  };

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  const priorityData = {
    ...defaultPriority,
    ...input,
    creatorId,
  };

  return await prisma.priority.create({
    data: priorityData,
  });
}

export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();

  const tableNames = ["Priority", "Role", "User"];

  for (const table of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Table might not exist
    }
  }
}
