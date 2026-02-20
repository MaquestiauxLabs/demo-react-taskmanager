// | Method | Endpoint                           | Description                                      |
// | ------ | ---------------------------------- | ------------------------------------------------ |
// | GET    | /api/tasks                         | List tasks (filter by project, status, assignee) |
// | POST   | /api/tasks                         | Create a task                                    |
// | GET    | /api/tasks/:id                     | Get task by ID                                   |
// | PUT    | /api/tasks/:id                     | Update task                                      |
// | DELETE | /api/tasks/:id                     | Delete task                                      |
// | POST   | /api/tasks/:id/assignees           | Assign user(s) to task                           |
// | DELETE | /api/tasks/:id/assignees/:userId   | Remove assignee from task                        |
// | GET    | /api/tasks/:id/subtasks            | List sub-tasks                                   |
// | POST   | /api/tasks/:id/subtasks            | Create sub-task                                  |
// | PUT    | /api/tasks/:id/subtasks/:subtaskId | Update sub-task                                  |
// | DELETE | /api/tasks/:id/subtasks/:subtaskId | Delete sub-task                                  |

import { Router } from "express";
import { TasksController } from "../controllers";

const router = Router();
const controller = new TasksController();

router.get("/", controller.get);

router.post("/", controller.create);

router.get("/:id", controller.getById);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;
