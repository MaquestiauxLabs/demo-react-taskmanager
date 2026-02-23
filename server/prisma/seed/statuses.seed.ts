import type { PrismaClient } from "../generated/client";

type StatusSeed = {
  name: string;
  color: string;
  creatorEmail: string;
};

const STATUSES: StatusSeed[] = [
  {
    name: "Todo",
    color: "#6B7280",
    creatorEmail: "admin@taskmanager.local",
  },
  {
    name: "In Progress",
    color: "#2563EB",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "Blocked",
    color: "#DC2626",
    creatorEmail: "john.smith@taskmanager.local",
  },
  {
    name: "Review",
    color: "#7C3AED",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "Done",
    color: "#059669",
    creatorEmail: "admin@taskmanager.local",
  },
];

export async function seedStatuses(prisma: PrismaClient) {
  const statusDelegate = (
    prisma as PrismaClient & {
      status?: {
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
  ).status;

  if (!statusDelegate) {
    throw new Error(
      "Status model is not available on PrismaClient. Run Prisma migrations and regenerate the client before seeding statuses.",
    );
  }

  await statusDelegate.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const status of STATUSES) {
    const creatorId = userIdByEmail.get(status.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed status "${status.name}": user "${status.creatorEmail}" not found.`,
      );
    }

    await statusDelegate.create({
      data: {
        name: status.name,
        color: status.color,
        creatorId,
      },
    });
  }
}
