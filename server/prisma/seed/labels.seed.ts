import type { PrismaClient } from "../generated/client";

type LabelSeed = {
  name: string;
  color: string;
  creatorEmail: string;
};

const LABELS: LabelSeed[] = [
  {
    name: "Backend",
    color: "#2563EB",
    creatorEmail: "admin@taskmanager.local",
  },
  {
    name: "Frontend",
    color: "#7C3AED",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "Bug",
    color: "#DC2626",
    creatorEmail: "john.smith@taskmanager.local",
  },
  {
    name: "Improvement",
    color: "#059669",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "Urgent",
    color: "#EA580C",
    creatorEmail: "admin@taskmanager.local",
  },
];

export async function seedLabels(prisma: PrismaClient) {
  await prisma.taskLabel.deleteMany();
  await prisma.projectLabel.deleteMany();

  const labelDelegate = (
    prisma as PrismaClient & {
      label?: {
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
  ).label;

  if (!labelDelegate) {
    throw new Error(
      "Label model is not available on PrismaClient. Run Prisma migrations and regenerate the client before seeding labels.",
    );
  }

  await labelDelegate.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const label of LABELS) {
    const creatorId = userIdByEmail.get(label.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed label "${label.name}": user "${label.creatorEmail}" not found.`,
      );
    }

    await labelDelegate.create({
      data: {
        name: label.name,
        color: label.color,
        creatorId,
      },
    });
  }
}
