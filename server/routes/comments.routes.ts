import { Router } from "express";
import { CommentsController } from "../controllers";

const router = Router();
const controller = new CommentsController();

/**
 * @openapi
 * /api/tasks/{taskId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Get all comments for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get("/tasks/:taskId/comments", controller.getByTaskId);

/**
 * @openapi
 * /api/projects/{projectId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Get all comments for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get("/projects/:projectId/comments", controller.getByProjectId);

/**
 * @openapi
 * /api/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Create a new comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               taskId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post("/comments", controller.create);

/**
 * @openapi
 * /api/comments/{id}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment found
 *       404:
 *         description: Comment not found
 */
router.get("/comments/:id", controller.getById);

/**
 * @openapi
 * /api/comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Update a comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *       404:
 *         description: Comment not found
 */
router.put("/comments/:id", controller.update);

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       404:
 *         description: Comment not found
 */
router.delete("/comments/:id", controller.delete);

export default router;
