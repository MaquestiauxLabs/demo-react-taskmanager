import cors from "cors";
import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middlewares";
import {
  commentsRouter,
  labelsRouter,
  prioritiesRouter,
  projectsRouter,
  rolesRouter,
  statusesRouter,
  tasksRouter,
  usersRouter,
} from "./routes";
import { logMessage } from "./utils";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, React Express Tasks Manager!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);
app.use("/api", commentsRouter);
app.use("/api/labels", labelsRouter);
app.use("/api/statuses", statusesRouter);
app.use("/api/priorities", prioritiesRouter);
app.use("/api/roles", rolesRouter);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "API for React Task Manager",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// The error handler MUST be the last middleware added
app.use(errorHandler);

app.listen(PORT, () => {
  logMessage("Server is running with global error handling", "info");
  logMessage(`Listening on port http://localhost:${PORT}`, "info");
});
