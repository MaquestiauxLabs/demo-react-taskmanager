import type { PrismaClient } from "../generated/client";

type ProjectSeed = {
  title: string;
  description?: string;
  creatorEmail: string;
  startDate?: Date;
  endDate?: Date;
  priorityName?: string;
  statusName?: string;
  labelNames?: string[];
};

function toLookupKey(value: string) {
  return value.trim().toLowerCase();
}

const now = new Date();

const PROJECTS: ProjectSeed[] = [
  {
    title: "Platform launch",
    description: "Coordinate and track all tasks for the first public release.",
    creatorEmail: "admin@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
    priorityName: "hIgH",
    statusName: "in progress",
    labelNames: ["baCkEnd", "uRGeNt"],
  },
  {
    title: "API hardening",
    description: "Improve reliability, validation, and endpoint consistency.",
    creatorEmail: "jane.doe@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    priorityName: "CRITICAL",
    statusName: "Review",
    labelNames: ["BACKEND", "improvement"],
  },
  {
    title: "Frontend polish",
    description: "Refine key UX flows and validate cross-browser behavior.",
    creatorEmail: "john.smith@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    priorityName: "MeDIuM",
    statusName: "tOdO",
    labelNames: ["frONtend", "Bug"],
  },
  {
    title: "Mobile readiness",
    description:
      "Prepare responsive behavior and mobile-specific QA checklist.",
    creatorEmail: "jane.doe@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
    priorityName: "low",
    statusName: "DONE",
    labelNames: ["FrOnTeNd", "Improvement"],
  },
  {
    title: "Security baseline",
    description: "Establish secure defaults, access rules, and audit checks.",
    creatorEmail: "admin@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    priorityName: "CriTicAl",
    statusName: "blocked",
    labelNames: ["backend", "URGENT", "bug"],
  },
  {
    title: "Documentation refresh",
    description: "Update product docs and onboarding notes for release prep.",
    creatorEmail: "john.smith@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    priorityName: "LOW",
    labelNames: ["improvement"],
  },
  {
    title: "QA signoff checklist",
    description: "Consolidate test evidence and complete QA approval steps.",
    creatorEmail: "jane.doe@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
    statusName: "dOnE",
    labelNames: ["uRgeNt", "frontend"],
  },
  {
    title: "Accessibility audit",
    description: "Review accessibility gaps and produce remediation backlog.",
    creatorEmail: "admin@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    priorityName: "medium",
    statusName: "todo",
  },
  {
    title: "Internal knowledge base",
    description: "Create a shared internal knowledge base for team operations.",
    creatorEmail: "john.smith@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    labelNames: ["Improvement"],
  },
  {
    title: "Customer feedback triage",
    description: "Group and prioritize recent customer feedback trends.",
    creatorEmail: "jane.doe@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
  },
];

export async function seedProjects(prisma: PrismaClient) {
  const projectDelegate = (
    prisma as PrismaClient & {
      project?: {
        deleteMany: () => Promise<unknown>;
        create: (args: {
          data: {
            title: string;
            description?: string;
            creatorId: string;
            startDate?: Date;
            endDate?: Date;
            priorityId?: string;
            statusId?: string;
            labels?: {
              connect: {
                id: string;
              }[];
            };
          };
        }) => Promise<unknown>;
      };
    }
  ).project;

  if (!projectDelegate) {
    throw new Error(
      "Project model is not available on PrismaClient. Run Prisma migrations and regenerate the client before seeding projects.",
    );
  }

  await projectDelegate.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
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

  const labels = await prisma.label.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const priorityIdByName = new Map(
    priorities.map((priority) => [toLookupKey(priority.name), priority.id]),
  );
  const statusIdByName = new Map(
    statuses.map((status) => [toLookupKey(status.name), status.id]),
  );
  const labelIdByName = new Map(
    labels.map((label) => [toLookupKey(label.name), label.id]),
  );

  for (const project of PROJECTS) {
    const creatorId = userIdByEmail.get(project.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed project "${project.title}": user "${project.creatorEmail}" not found.`,
      );
    }

    const priorityId = project.priorityName
      ? priorityIdByName.get(toLookupKey(project.priorityName))
      : undefined;

    if (project.priorityName && !priorityId) {
      throw new Error(
        `Cannot seed project "${project.title}": priority "${project.priorityName}" not found.`,
      );
    }

    const statusId = project.statusName
      ? statusIdByName.get(toLookupKey(project.statusName))
      : undefined;

    if (project.statusName && !statusId) {
      throw new Error(
        `Cannot seed project "${project.title}": status "${project.statusName}" not found.`,
      );
    }

    const labelIds =
      project.labelNames?.map((labelName) => {
        const labelId = labelIdByName.get(toLookupKey(labelName));

        if (!labelId) {
          throw new Error(
            `Cannot seed project "${project.title}": label "${labelName}" not found.`,
          );
        }

        return labelId;
      }) ?? [];

    await projectDelegate.create({
      data: {
        title: project.title,
        description: project.description,
        creatorId,
        startDate: project.startDate,
        endDate: project.endDate,
        priorityId,
        statusId,
        labelLinks: labelIds.length
          ? {
              create: labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
    });
  }
}
