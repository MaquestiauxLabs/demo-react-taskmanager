import { Router } from "express";
import { LabelsController } from "../controllers";

const router = Router();
const controller = new LabelsController();

/**
 * @openapi
 * /api/labels:
 *   get:
 *     tags: [Labels]
 *     summary: Get all labels
 *     description: Returns all labels from the database
 *     responses:
 *       200:
 *         description: List of labels
 *       404:
 *         description: No labels found
 */
router.get("/", controller.get);

/**
 * @openapi
 * /api/labels:
 *   post:
 *     tags: [Labels]
 *     summary: Create a new label
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
 *               creatorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Label created
 *       400:
 *         description: Invalid input
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/labels/{id}:
 *   get:
 *     tags: [Labels]
 *     summary: Get label by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label found
 *       404:
 *         description: Label not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/labels/{id}:
 *   put:
 *     tags: [Labels]
 *     summary: Update a label
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label updated
 *       404:
 *         description: Label not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/labels/{id}:
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label deleted
 *       404:
 *         description: Label not found
 */
router.delete("/:id", controller.delete);

export default router;
