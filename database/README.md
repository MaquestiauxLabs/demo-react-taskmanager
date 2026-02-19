# Database

## Prisma Guide

Prisma is an ORM that simplifies database access in TypeScript/JavaScript applications.

Attention: Prisma needs to be able to create a shadow database to run the migrations.

### Setup

1. Install dependencies in the `server` folder:

   ```bash
   cd server && npm install
   ```

2. Configure your database connection in `server/prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Set the `DATABASE_URL` in your `.env` file:

   ```text
   DATABASE_URL="postgresql://tasks_manager:tasks_manager@localhost:15432/tasks_manager"
   ```

4. (Optional) Set the `SHADOW_DATABASE_URL` in your `.env` file:

   ```text
   SHADOW_DATABASE_URL="postgresql://tasks_manager:tasks_manager@localhost:15432/tasks_manager_shadow"
   ```

5. Configure Prisma in `server/prisma.config.ts`:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
```

### Common Commands

Run these from the `server` directory:

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate`  | Run database migrations            |
| `npm run prisma:studio`   | Open web UI to view/edit data      |

### Workflow

1. **Define your schema** in `server/prisma/schema.prisma`
2. **Run migration** to apply changes: `npm run prisma:migrate -- --name init`
3. **Generate client** to update the generated code: `npm run prisma:generate`
4. **Use in code**:

   ```typescript
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();
   const users = await prisma.user.findMany();
   ```

### Reset Database

To reset and reapply migrations:

```bash
npx prisma migrate reset
```

## Create the database

If you do not have an postgresql server running, you can start one using Docker:

Create a `docker-compose.yml` file with the following content:

```yaml
services:
  db:
    image: postgres:18.2-alpine # Specific versions are safer than 'latest'
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_USER: tasks_manager
      POSTGRES_PASSWORD: tasks_manager
      POSTGRES_DB: tasks_manager
    ports:
      - "15432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

volumes:
  postgres_data:
```

Create an `init-db.sql` file with the following content to create the shadow database:

```sql
CREATE DATABASE tasks_manager_shadow;
GRANT ALL PRIVILEGES ON DATABASE tasks_manager_shadow TO tasks_manager;
```

## Create the user and database if not using Docker

```sql
CREATE ROLE tasks_manager WITH LOGIN PASSWORD 'tasks_manager';
CREATE DATABASE tasks_manager OWNER tasks_manager;
CREATE DATABASE tasks_manager_shadow OWNER tasks_manager;
```
