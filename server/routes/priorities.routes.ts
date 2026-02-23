// | Method | Endpoint       | Description    |
// | ------ | -------------- | -------------- |
// | GET    | /api/priorities     | List all priorities |
// | POST   | /api/priorities     | Create a priority  |
// | GET    | /api/priorities/:id | Get priority by ID |
// | PUT    | /api/priorities/:id | Update priority    |
// | DELETE | /api/priorities/:id | Delete priority    |
import { Router } from "express";
import { PrioritiesController } from "../controllers";

const router = Router();
const controller = new PrioritiesController();
router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;
