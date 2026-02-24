import { Router } from "express";
import { ProjectsController } from "../controllers";

const router = Router();
const controller = new ProjectsController();
router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;
