// | Method | Endpoint       | Description    |
// | ------ | -------------- | -------------- |
// | GET    | /api/users     | List all users |
// | POST   | /api/users     | Create a user  |
// | GET    | /api/users/:id | Get user by ID |
// | PUT    | /api/users/:id | Update user    |
// | DELETE | /api/users/:id | Delete user    |
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
