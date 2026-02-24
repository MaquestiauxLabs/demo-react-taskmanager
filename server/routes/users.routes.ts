import { Router } from "express";
import { UsersController } from "../controllers";

const router = Router();
const controller = new UsersController();
router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;
