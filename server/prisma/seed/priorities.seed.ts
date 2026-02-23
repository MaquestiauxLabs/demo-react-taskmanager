import type { PrismaClient } from "../generated/client";

type PrioritySeed = {
  name: string;
  color: string;
  creatorEmail: string;
};

const PRIORITIES: PrioritySeed[] = [
  {
    name: "Low",
    color: "#6B7280",
    creatorEmail: "admin@taskmanager.local",
  },
  {
    name: "Medium",
    color: "#2563EB",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "High",
    color: "#D97706",
    creatorEmail: "john.smith@taskmanager.local",
  },
  {
    name: "Critical",
    color: "#DC2626",
    creatorEmail: "admin@taskmanager.local",
  },
];

export async function seedPriorities(prisma: PrismaClient) {
  const priorityDelegate = (
    prisma as PrismaClient & {
      priority?: {
        deleteMany: () => Promise<unknown>;
        create: (args: {
          data: {
            name: string;
            color: string;
            creatorId: string;
          };
        }) => Promise<unknown>;
      };
    }
  ).priority;

  if (!priorityDelegate) {
    throw new Error(
      "Priority model is not available on PrismaClient. Run Prisma migrations and regenerate the client before seeding priorities.",
    );
  }

  await priorityDelegate.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const priority of PRIORITIES) {
    const creatorId = userIdByEmail.get(priority.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed priority "${priority.name}": user "${priority.creatorEmail}" not found.`,
      );
    }

    await priorityDelegate.create({
      data: {
        name: priority.name,
        color: priority.color,
        creatorId,
      },
    });
  }
}
