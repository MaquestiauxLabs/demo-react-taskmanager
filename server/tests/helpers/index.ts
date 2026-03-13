import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Label,
  Priority,
  Role,
  Status,
  Task,
  TimeEntry,
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

export type CreateTestStatusInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

export async function createTestStatus(
  input: CreateTestStatusInput = {},
): Promise<Status> {
  const prisma = getTestPrisma();

  const defaultStatus = {
    name: `Status-${Date.now()}-${Math.random()}`,
    color: "#FF5733",
  };

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  const statusData = {
    ...defaultStatus,
    ...input,
    creatorId,
  };

  return await prisma.status.create({
    data: statusData,
  });
}

export type CreateTestLabelInput = {
  name?: string;
  color?: string;
  creatorId?: string;
};

export async function createTestLabel(
  input: CreateTestLabelInput = {},
): Promise<Label> {
  const prisma = getTestPrisma();

  const defaultLabel = {
    name: `Label-${Date.now()}-${Math.random()}`,
    color: "#FF5733",
  };

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  const labelData = {
    ...defaultLabel,
    ...input,
    creatorId,
  };

  return await prisma.label.create({
    data: labelData,
  });
}

export type CreateTestTaskInput = {
  title?: string;
  description?: string;
  creatorId?: string;
  priorityId?: string | null;
  statusId?: string | null;
  projectId?: string | null;
};

export async function createTestTask(
  input: CreateTestTaskInput = {},
): Promise<Task> {
  const prisma = getTestPrisma();

  const defaultTask = {
    title: `Task-${Date.now()}-${Math.random()}`,
  };

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  let statusId = input.statusId;
  if (!statusId) {
    const status = await createTestStatus();
    statusId = status.id;
  }

  const taskData = {
    ...defaultTask,
    ...input,
    creatorId,
    statusId,
  };

  return await prisma.task.create({
    data: taskData,
  });
}

export type CreateTestTimeEntryInput = {
  taskId?: string;
  creatorId?: string;
  startDate?: Date;
  endDate?: Date | null;
  duration?: number;
  description?: string | null;
};

export async function createTestTimeEntry(
  input: CreateTestTimeEntryInput = {},
): Promise<TimeEntry> {
  const prisma = getTestPrisma();

  const defaultTimeEntry = {
    startDate: new Date(),
    duration: 0,
  };

  let taskId = input.taskId;
  if (!taskId) {
    const task = await createTestTask();
    taskId = task.id;
  }

  let creatorId = input.creatorId;
  if (!creatorId) {
    const creator = await createTestUser();
    creatorId = creator.id;
  }

  const timeEntryData = {
    ...defaultTimeEntry,
    ...input,
    taskId,
    creatorId,
  };

  return await prisma.timeEntry.create({
    data: timeEntryData,
  });
}

export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();

  const tableNames = [
    "TimeEntry",
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
