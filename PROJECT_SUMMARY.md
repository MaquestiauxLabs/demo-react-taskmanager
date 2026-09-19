# Project Summary: React Task Manager Demo

This project is a task management application built with a modern web development stack.

## Architecture

The project is structured as a full-stack monorepo with separate directories for client and server.

- **`client/`**: Frontend application built with React 19, TypeScript, Vite, and Tailwind CSS.
- **`server/`**: Backend API built with Express, TypeScript, Prisma ORM, and PostgreSQL.

## Core Components

- **Frontend (`client/`)**:
  - Uses Vite for bundling and development.
  - Styled with Tailwind CSS.
  - Configured with ESLint and Prettier for code quality.

- **Backend (`server/`)**:
  - Express-based REST API.
  - Prisma used for database interactions.
  - Organized with controllers, middlewares, routes, and services.
  - Testing suite included using `vitest`.

- **Other**:
  - **`database/`**: Likely contains database-related configurations or scripts.
  - **`sso/`**: Directory indicating potential support for Single Sign-On (SSO) authentication.
  - **`docs/`**: Project documentation.

  ## API Documentation

  The backend API is documented using Swagger. Once the backend server is running, you can view the interactive API documentation at:
  - **Swagger UI URL**: [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/)

  ## Getting Started

1. **Install Dependencies**:

   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Development**:
   - Start the client: `cd client && npm run dev`
   - Start the server: `cd server && npm run dev`

## 📝 Development Guidelines

Please ensure all markdown files follow the [markdownlint](https://github.com/DavidAnson/markdownlint) rules. You can verify this using the markdownlint extension in your editor.
