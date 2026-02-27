import type { PrismaClient } from "../generated/client";

function toLookupKey(value: string) {
  return value.trim().toLowerCase();
}

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
  projectTitle?: string;
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
    labelNames: ["iMProVeMenT"],
    priorityName: "hIgH",
    statusName: "in progress",
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
    labelNames: ["baCkEnd", "uRGenT"],
    priorityName: "CRITICAL",
    statusName: "IN PROGRESS",
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
    labelNames: ["frONtEnd", "bUG"],
    priorityName: "hIGh",
    statusName: "rEViEw",
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

  // API hardening project - single task
  {
    key: "validate-endpoints",
    title: "Validate all endpoint inputs",
    description: "Add comprehensive input validation to all API endpoints.",
    creatorEmail: "jane.doe@taskmanager.local",
    projectTitle: "api hardening",
    startDate: now,
    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    estimatedHours: 6,
    labelNames: ["BACKEND"],
    priorityName: "HIGH",
    statusName: "in progress",
  },

  // Frontend polish project - three tasks
  {
    key: "refine-task-form",
    title: "Refine task creation form UX",
    description: "Improve form layout, validation messages, and accessibility.",
    creatorEmail: "john.smith@taskmanager.local",
    projectTitle: "frOntend polish",
    startDate: now,
    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    estimatedHours: 8,
    labelNames: ["FrOnTeNd", "IMPROVEMENT"],
    priorityName: "mEDiuM",
    statusName: "in progress",
  },
  {
    key: "cross-browser-testing",
    title: "Cross-browser testing and fixes",
    description:
      "Verify and fix CSS/JS issues across Chrome, Firefox, Safari, Edge.",
    creatorEmail: "john.smith@taskmanager.local",
    projectTitle: "FRONTEND POLISH",
    startDate: now,
    dueDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
    estimatedHours: 10,
    labelNames: ["frontend", "BUG"],
    priorityName: "hIGh",
    statusName: "tOdO",
  },
  {
    key: "dark-mode-support",
    title: "Add dark mode support",
    description: "Implement theme toggle and persist user preference.",
    creatorEmail: "jane.doe@taskmanager.local",
    projectTitle: "Frontend polish",
    startDate: now,
    dueDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
    estimatedHours: 5,
    labelNames: ["Frontend", "Improvement"],
    priorityName: "Low",
    statusName: "Todo",
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

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const labelIdByName = new Map(
    labels.map((label) => [toLookupKey(label.name), label.id]),
  );
  const priorityIdByName = new Map(
    priorities.map((priority) => [toLookupKey(priority.name), priority.id]),
  );
  const statusIdByName = new Map(
    statuses.map((status) => [toLookupKey(status.name), status.id]),
  );
  const projectIdByTitle = new Map(
    projects.map((project) => [toLookupKey(project.title), project.id]),
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
          ? (priorityIdByName.get(toLookupKey(task.priorityName)) ?? null)
          : null,
        statusId: task.statusName
          ? (statusIdByName.get(toLookupKey(task.statusName)) ?? null)
          : null,
        projectId: task.projectTitle
          ? (projectIdByTitle.get(toLookupKey(task.projectTitle)) ?? null)
          : null,
        labelLinks: task.labelNames
          ? {
              create: task.labelNames
                .map((name) => toLookupKey(name))
                .filter((name) => labelIdByName.has(name))
                .map((name) => ({ labelId: labelIdByName.get(name)! })),
            }
          : undefined,
      },
      select: { id: true },
    });

    taskIdByKey.set(task.key, created.id);
  }
}
