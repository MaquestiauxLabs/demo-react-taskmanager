import type { PrismaClient } from "../generated/client";

type UserSeed = {
  email: string;
  givenName: string;
  familyName: string;
  avatarUrl?: string;
};

const USERS: UserSeed[] = [
  {
    email: "admin@taskmanager.local",
    givenName: "Admin",
    familyName: "User",
    avatarUrl: "https://i.pravatar.cc/150?u=admin-taskmanager",
  },
  {
    email: "jane.doe@taskmanager.local",
    givenName: "Jane",
    familyName: "Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=jane-taskmanager",
  },
  {
    email: "john.smith@taskmanager.local",
    givenName: "John",
    familyName: "Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=john-taskmanager",
  },
];

export async function seedUsers(prisma: PrismaClient) {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        givenName: user.givenName,
        familyName: user.familyName,
        avatarUrl: user.avatarUrl,
      },
      create: user,
    });
  }
}
