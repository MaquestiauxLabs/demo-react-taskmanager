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
  labelNames?: string[];
  priorityName?: string;
  statusName?: string;
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
    labelNames: ["Improvement"],
    priorityName: "High",
    statusName: "In Progress",
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
    labelNames: ["Backend", "Urgent"],
    priorityName: "Critical",
    statusName: "In Progress",
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
    labelNames: ["Backend", "Improvement"],
    priorityName: "Medium",
    statusName: "Todo",
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
    labelNames: ["Frontend", "Bug"],
    priorityName: "High",
    statusName: "Review",
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
    labelNames: ["Backend", "Frontend", "Bug"],
    priorityName: "Medium",
    statusName: "Done",
  },
  {
    key: "update-dependencies",
    title: "Update npm dependencies",
    description: "Review and update outdated packages.",
    creatorEmail: "john.smith@taskmanager.local",
    statusName: "Done",
  },
  {
    key: "design-review",
    title: "Design review meeting",
    creatorEmail: "jane.doe@taskmanager.local",
    priorityName: "Low",
  },
  {
    key: "setup-ci",
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing.",
    creatorEmail: "admin@taskmanager.local",
    labelNames: ["Backend", "Improvement"],
    statusName: "In Progress",
  },
  {
    key: "fix-login-bug",
    title: "Fix login redirect bug",
    creatorEmail: "john.smith@taskmanager.local",
    labelNames: ["Bug", "Urgent"],
    priorityName: "Critical",
    statusName: "Blocked",
  },
  {
    key: "research-offline",
    title: "Research offline mode",
    description: "Investigate options for offline task editing.",
    creatorEmail: "jane.doe@taskmanager.local",
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

  const labels = await prisma.label.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const priorities = await prisma.priority.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const statuses = await prisma.status.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const labelIdByName = new Map(labels.map((label) => [label.name, label.id]));
  const priorityIdByName = new Map(
    priorities.map((priority) => [priority.name, priority.id]),
  );
  const statusIdByName = new Map(
    statuses.map((status) => [status.name, status.id]),
  );
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
        priorityId: task.priorityName
          ? priorityIdByName.get(task.priorityName)
          : null,
        statusId: task.statusName ? statusIdByName.get(task.statusName) : null,
        labels: task.labelNames
          ? {
              connect: task.labelNames
                .filter((name) => labelIdByName.has(name))
                .map((name) => ({ id: labelIdByName.get(name)! })),
            }
          : undefined,
      },
      select: { id: true },
    });

    taskIdByKey.set(task.key, created.id);
  }
}
