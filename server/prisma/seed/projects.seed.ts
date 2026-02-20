import type { PrismaClient } from "../generated/client";

type ProjectSeed = {
  title: string;
  description?: string;
  creatorEmail: string;
  startDate?: Date;
  endDate?: Date;
};

const now = new Date();

const PROJECTS: ProjectSeed[] = [
  {
    title: "Platform launch",
    description: "Coordinate and track all tasks for the first public release.",
    creatorEmail: "admin@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
  },
  {
    title: "API hardening",
    description: "Improve reliability, validation, and endpoint consistency.",
    creatorEmail: "jane.doe@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Frontend polish",
    description: "Refine key UX flows and validate cross-browser behavior.",
    creatorEmail: "john.smith@taskmanager.local",
    startDate: now,
    endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
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

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const project of PROJECTS) {
    const creatorId = userIdByEmail.get(project.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed project "${project.title}": user "${project.creatorEmail}" not found.`,
      );
    }

    await projectDelegate.create({
      data: {
        title: project.title,
        description: project.description,
        creatorId,
        startDate: project.startDate,
        endDate: project.endDate,
      },
    });
  }
}
