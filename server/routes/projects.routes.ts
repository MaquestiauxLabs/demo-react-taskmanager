import { Router } from "express";
import { ProjectsController } from "../controllers";

const router = Router();
const controller = new ProjectsController();
router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

router.put("/:id/archive", controller.archive);

router.put("/:id/unarchive", controller.unarchive);

router.post("/:id/assignee", controller.assignUser);

router.delete("/:id/assignee", controller.unassignUser);

export default router;
