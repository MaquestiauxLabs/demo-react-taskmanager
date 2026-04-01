import { Router } from "express";
import { ProjectsController } from "../controllers";

const router = Router();
const controller = new ProjectsController();

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects
 *     description: Returns all projects from the database
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get("/", controller.get);

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project found
 *       404:
 *         description: Project not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete("/:id", controller.delete);

/**
 * @openapi
 * /api/projects/{id}/archive:
 *   put:
 *     tags: [Projects]
 *     summary: Archive a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project archived
 */
router.put("/:id/archive", controller.archive);

/**
 * @openapi
 * /api/projects/{id}/unarchive:
 *   put:
 *     tags: [Projects]
 *     summary: Unarchive a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project unarchived
 */
router.put("/:id/unarchive", controller.unarchive);

/**
 * @openapi
 * /api/projects/{id}/assignee:
 *   post:
 *     tags: [Projects]
 *     summary: Assign user to project
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
 * /api/projects/{id}/assignee:
 *   delete:
 *     tags: [Projects]
 *     summary: Unassign user from project
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

export default router;
