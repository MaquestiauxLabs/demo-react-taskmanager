// | Method | Endpoint       | Description    |
// | ------ | -------------- | -------------- |
// | GET    | /api/statuses     | List all statuses |
// | POST   | /api/statuses     | Create a status  |
// | GET    | /api/statuses/:id | Get status by ID |
// | PUT    | /api/statuses/:id | Update status    |
// | DELETE | /api/statuses/:id | Delete status    |
import { Router } from "express";
import { StatusesController } from "../controllers";

const router = Router();
const controller = new StatusesController();
router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;
