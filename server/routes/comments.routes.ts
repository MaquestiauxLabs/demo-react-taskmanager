import { Router } from "express";
import { CommentsController } from "../controllers";

const router = Router();
const controller = new CommentsController();

router.get("/tasks/:taskId/comments", controller.getByTaskId);

router.get("/projects/:projectId/comments", controller.getByProjectId);

router.post("/comments", controller.create);

router.get("/comments/:id", controller.getById);

router.put("/comments/:id", controller.update);

router.delete("/comments/:id", controller.delete);

export default router;
