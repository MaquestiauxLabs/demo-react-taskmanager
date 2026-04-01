import { Router } from "express";
import { TasksController } from "../controllers";
import timeEntriesRouter from "./timeEntries.routes";

const router = Router();
const controller = new TasksController();

router.use("/:id/time-entries", timeEntriesRouter);

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks
 *     description: Returns all tasks from the database
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get("/", controller.get);

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               statusId:
 *                 type: string
 *               priorityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
router.delete("/:id", controller.delete);

/**
 * @openapi
 * /api/tasks/{id}/labels:
 *   post:
 *     tags: [Tasks]
 *     summary: Add labels to a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Labels added
 */
router.post("/:id/labels", controller.addLabels);

/**
 * @openapi
 * /api/tasks/{id}/labels:
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove labels from a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Labels removed
 */
router.delete("/:id/labels", controller.removeLabels);

/**
 * @openapi
 * /api/tasks/{id}/priority:
 *   put:
 *     tags: [Tasks]
 *     summary: Set task priority
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priorityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Priority set
 */
router.put("/:id/priority", controller.setPriority);

/**
 * @openapi
 * /api/tasks/{id}/status:
 *   put:
 *     tags: [Tasks]
 *     summary: Set task status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statusId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status set
 */
router.put("/:id/status", controller.setStatus);

/**
 * @openapi
 * /api/tasks/{id}/project:
 *   put:
 *     tags: [Tasks]
 *     summary: Assign task to project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project assigned
 */
router.put("/:id/project", controller.assignProject);

/**
 * @openapi
 * /api/tasks/{id}/project:
 *   delete:
 *     tags: [Tasks]
 *     summary: Unassign task from project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project unassigned
 */
router.delete("/:id/project", controller.unassignProject);

/**
 * @openapi
 * /api/tasks/{id}/archive:
 *   put:
 *     tags: [Tasks]
 *     summary: Archive a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task archived
 */
router.put("/:id/archive", controller.archive);

/**
 * @openapi
 * /api/tasks/{id}/unarchive:
 *   put:
 *     tags: [Tasks]
 *     summary: Unarchive a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task unarchived
 */
router.put("/:id/unarchive", controller.unarchive);

/**
 * @openapi
 * /api/tasks/{id}/assignee:
 *   post:
 *     tags: [Tasks]
 *     summary: Assign user to task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User assigned
 */
router.post("/:id/assignee", controller.assignUser);

/**
 * @openapi
 * /api/tasks/{id}/assignee:
 *   delete:
 *     tags: [Tasks]
 *     summary: Unassign user from task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User unassigned
 */
router.delete("/:id/assignee", controller.unassignUser);

/**
 * @openapi
 * /api/tasks/{id}/watchers:
 *   post:
 *     tags: [Tasks]
 *     summary: Add watcher to task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Watcher added
 */
router.post("/:id/watchers", controller.watchUser);

/**
 * @openapi
 * /api/tasks/{id}/watchers:
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove watcher from task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Watcher removed
 */
router.delete("/:id/watchers", controller.unwatchUser);

export default router;
