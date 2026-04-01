import { Router } from "express";
import { TimeEntriesController } from "../controllers";

const router = Router({ mergeParams: true });
const controller = new TimeEntriesController();

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Get all time entries for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of time entries
 */
router.get("/", controller.getByTaskId);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries:
 *   post:
 *     tags: [TimeEntries]
 *     summary: Create a new time entry
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               duration:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Time entry created
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries/start:
 *   post:
 *     tags: [TimeEntries]
 *     summary: Start timer for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Timer started
 */
router.post("/start", controller.startTimer);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries/{id}:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Get time entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time entry found
 *       404:
 *         description: Time entry not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries/{id}:
 *   put:
 *     tags: [TimeEntries]
 *     summary: Update a time entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time entry updated
 *       404:
 *         description: Time entry not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries/{id}/stop:
 *   post:
 *     tags: [TimeEntries]
 *     summary: Stop timer for a time entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timer stopped
 */
router.post("/:id/stop", controller.stopTimer);

/**
 * @openapi
 * /api/tasks/{taskId}/time-entries/{id}:
 *   delete:
 *     tags: [TimeEntries]
 *     summary: Delete a time entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time entry deleted
 *       404:
 *         description: Time entry not found
 */
router.delete("/:id", controller.delete);

export default router;
