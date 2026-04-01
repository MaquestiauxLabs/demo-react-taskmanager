import { Router } from "express";
import { PrioritiesController } from "../controllers";

const router = Router();
const controller = new PrioritiesController();

/**
 * @openapi
 * /api/priorities:
 *   get:
 *     tags: [Priorities]
 *     summary: Get all priorities
 *     description: Returns all priorities from the database
 *     responses:
 *       200:
 *         description: List of priorities
 */
router.get("/", controller.get);

/**
 * @openapi
 * /api/priorities:
 *   post:
 *     tags: [Priorities]
 *     summary: Create a new priority
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
 *         description: Priority created
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/priorities/{id}:
 *   get:
 *     tags: [Priorities]
 *     summary: Get priority by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Priority found
 *       404:
 *         description: Priority not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/priorities/{id}:
 *   put:
 *     tags: [Priorities]
 *     summary: Update a priority
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Priority updated
 *       404:
 *         description: Priority not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/priorities/{id}:
 *   delete:
 *     tags: [Priorities]
 *     summary: Delete a priority
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Priority deleted
 *       404:
 *         description: Priority not found
 */
router.delete("/:id", controller.delete);

export default router;
