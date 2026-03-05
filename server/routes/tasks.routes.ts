import { Router } from "express";
import { TasksController } from "../controllers";

const router = Router();
const controller = new TasksController();

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

export default router;
