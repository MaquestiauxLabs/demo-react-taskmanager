import { Router } from "express";
import { TasksController } from "../controllers";
import timeEntriesRouter from "./timeEntries.routes";

const router = Router();
const controller = new TasksController();

router.use("/:id/time-entries", timeEntriesRouter);

router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

router.post("/:id/labels", controller.addLabels);

router.delete("/:id/labels", controller.removeLabels);

router.put("/:id/priority", controller.setPriority);

router.put("/:id/status", controller.setStatus);

router.put("/:id/project", controller.assignProject);

router.delete("/:id/project", controller.unassignProject);

router.put("/:id/archive", controller.archive);

router.put("/:id/unarchive", controller.unarchive);

router.post("/:id/assignee", controller.assignUser);

router.delete("/:id/assignee", controller.unassignUser);

router.post("/:id/watchers", controller.watchUser);

router.delete("/:id/watchers", controller.unwatchUser);

export default router;
