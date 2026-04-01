import { Router } from "express";
import { StatusesController } from "../controllers";

const router = Router();
const controller = new StatusesController();

/**
 * @openapi
 * /api/statuses:
 *   get:
 *     tags: [Statuses]
 *     summary: Get all statuses
 *     description: Returns all statuses from the database
 *     responses:
 *       200:
 *         description: List of statuses
 */
router.get("/", controller.get);

/**
 * @openapi
 * /api/statuses:
 *   post:
 *     tags: [Statuses]
 *     summary: Create a new status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Status created
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/statuses/{id}:
 *   get:
 *     tags: [Statuses]
 *     summary: Get status by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status found
 *       404:
 *         description: Status not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/statuses/{id}:
 *   put:
 *     tags: [Statuses]
 *     summary: Update a status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Status not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/statuses/{id}:
 *   delete:
 *     tags: [Statuses]
 *     summary: Delete a status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status deleted
 *       404:
 *         description: Status not found
 */
router.delete("/:id", controller.delete);

export default router;
