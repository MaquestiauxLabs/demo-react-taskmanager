import type { PrismaClient } from "../generated/client";

type RoleSeed = {
  name: string;
  color: string;
  creatorEmail: string;
};

const ROLES: RoleSeed[] = [
  {
    name: "Admin",
    color: "#DC2626",
    creatorEmail: "admin@taskmanager.local",
  },
  {
    name: "Manager",
    color: "#2563EB",
    creatorEmail: "jane.doe@taskmanager.local",
  },
  {
    name: "Contributor",
    color: "#059669",
    creatorEmail: "john.smith@taskmanager.local",
  },
  {
    name: "Viewer",
    color: "#6B7280",
    creatorEmail: "admin@taskmanager.local",
  },
];

export async function seedRoles(prisma: PrismaClient) {
  const roleDelegate = (
    prisma as PrismaClient & {
      role?: {
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
  ).role;

  if (!roleDelegate) {
    throw new Error(
      "Role model is not available on PrismaClient. Run Prisma migrations and regenerate the client before seeding roles.",
    );
  }

  await roleDelegate.deleteMany();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const role of ROLES) {
    const creatorId = userIdByEmail.get(role.creatorEmail);

    if (!creatorId) {
      throw new Error(
        `Cannot seed role "${role.name}": user "${role.creatorEmail}" not found.`,
      );
    }

    await roleDelegate.create({
      data: {
        name: role.name,
        color: role.color,
        creatorId,
      },
    });
  }
}
