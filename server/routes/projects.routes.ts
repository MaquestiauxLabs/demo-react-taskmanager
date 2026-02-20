// | Method | Endpoint                          | Description                |
// | ------ | --------------------------------- | -------------------------- |
// | GET    | /api/projects                     | List all projects          |
// | POST   | /api/projects                     | Create a project           |
// | GET    | /api/projects/:id                 | Get project by ID          |
// | PUT    | /api/projects/:id                 | Update project             |
// | DELETE | /api/projects/:id                 | Delete project             |
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
