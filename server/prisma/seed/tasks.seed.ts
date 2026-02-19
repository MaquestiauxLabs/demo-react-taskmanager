import type { PrismaClient } from "../generated/client";

type TaskSeed = {
  key: string;
  title: string;
  description?: string;
  creatorEmail: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  parentKey?: string;
};

const now = new Date();

const TASKS: TaskSeed[] = [
  {
    key: "platform-launch",
    title: "Platform launch",
    description: "Coordinate first public release of the task manager.",
    creatorEmail: "admin@taskmanager.local",
    startDate: now,
    dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    estimatedHours: 24,
  },
  {
    key: "api-checklist",
    title: "API readiness checklist",
    description: "Verify endpoints, auth, and error handling.",
    creatorEmail: "jane.doe@taskmanager.local",
    parentKey: "platform-launch",
    startDate: now,
    dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    estimatedHours: 8,
  },
  {
    key: "api-docs",
    title: "Document API examples",
    description: "Create sample request/response docs for top endpoints.",
    creatorEmail: "john.smith@taskmanager.local",
    parentKey: "api-checklist",
    startDate: now,
    dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    estimatedHours: 3,
  },
  {
    key: "frontend-qa",
    title: "Frontend QA pass",
    description: "Run browser checks and verify task flows.",
    creatorEmail: "jane.doe@taskmanager.local",
    parentKey: "platform-launch",
    startDate: now,
    dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    estimatedHours: 10,
  },
  {
    key: "smoke-tests",
    title: "Smoke tests",
    description: "Automate and run basic smoke tests before release.",
    creatorEmail: "admin@taskmanager.local",
    parentKey: "frontend-qa",
    startDate: now,
    dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
    estimatedHours: 5,
  },
];

export async function seedTasks(prisma: PrismaClient) {
  await prisma.task.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const taskIdByKey = new Map<string, string>();

  const pending = [...TASKS];

  while (pending.length > 0) {
    const task = pending.shift();

    if (!task) {
      break;
    }

    const creatorId = userIdByEmail.get(task.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed task "${task.title}": user "${task.creatorEmail}" not found.`,
      );
    }

    if (task.parentKey && !taskIdByKey.has(task.parentKey)) {
      pending.push(task);
      continue;
    }

    const created = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        creatorId,
        startDate: task.startDate,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        parentId: task.parentKey ? taskIdByKey.get(task.parentKey) : null,
      },
      select: { id: true },
    });

    taskIdByKey.set(task.key, created.id);
  }
}
