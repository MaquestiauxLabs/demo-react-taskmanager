import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../generated/client";
import { seedComments } from "./comments.seed";
import { seedLabels } from "./labels.seed";
import { seedPriorities } from "./priorities.seed";
import { seedProjects } from "./projects.seed";
import { seedRoles } from "./roles.seed";
import { seedStatuses } from "./statuses.seed";
import { seedTasks } from "./tasks.seed";
import { seedUsers } from "./users.seed";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedUsers(prisma);
  await seedLabels(prisma);
  await seedPriorities(prisma);
  await seedRoles(prisma);
  await seedStatuses(prisma);
  await seedProjects(prisma);
  await seedTasks(prisma);
  await seedComments(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
