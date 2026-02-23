import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares";
import {
  labelsRouter,
  prioritiesRouter,
  projectsRouter,
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
app.use("/api/labels", labelsRouter);
app.use("/api/statuses", statusesRouter);
app.use("/api/priorities", prioritiesRouter);

// The error handler MUST be the last middleware added
app.use(errorHandler);

app.listen(PORT, () => {
  logMessage("Server is running with global error handling", "info");
  logMessage(`Listening on port http://localhost:${PORT}`, "info");
});
