import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares";
import { tasksRouter, usersRouter } from "./routes";
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

// The error handler MUST be the last middleware added
app.use(errorHandler);

app.listen(PORT, () => {
  logMessage("Server is running with global error handling", "info");
  logMessage(`Listening on port http://localhost:${PORT}`, "info");
});
