# Server

Express + TypeScript + Prisma + PostgreSQL

## 🛠️ Tech Stack

- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Linting**: ESLint + Prettier

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Comments

- `GET /api/tasks/:taskId/comments` - List comments for a task
- `GET /api/projects/:projectId/comments` - List comments for a project
- `POST /api/comments` - Create a comment
- `GET /api/comments/:id` - Get one comment by ID
- `PUT /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment

### Comments payload rules

- `content` is required when creating a comment
- `creatorId` is required for create and update
- Exactly one target is required: `taskId` or `projectId`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ by [Jean-Philippe Maquestiaux](https://github.com/maquejp)
