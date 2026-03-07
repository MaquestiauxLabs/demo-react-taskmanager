import { Router } from "express";
import { TimeEntriesController } from "../controllers";

const router = Router({ mergeParams: true });
const controller = new TimeEntriesController();

router.get("/", controller.getByTaskId);

router.post("/", controller.create);

router.post("/start", controller.startTimer);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.post("/:id/stop", controller.stopTimer);

router.delete("/:id", controller.delete);

export default router;
