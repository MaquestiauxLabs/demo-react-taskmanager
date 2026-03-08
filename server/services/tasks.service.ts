import {
  isPrismaConflictError,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  normalizeManyTasksWithDetails,
  normalizeTaskWithDetails,
  prisma,
  standardiseResponse,
} from "../utils";

type CreateTaskInput = {
  title?: string;
  description?: string | null;
  parentId?: string | null;
  creatorId?: string;
  priorityId?: string | null;
  statusId?: string | null;
  projectId?: string | null;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  isArchived?: boolean;
};

type UpdateTaskInput = Partial<CreateTaskInput>;

const taskInclude = {
  labelLinks: {
    include: {
      label: true,
    },
  },
  priority: true,
  status: true,
  commentLinks: {
    include: {
      comment: true,
    },
  },
  watchers: {
    include: {
      user: true,
    },
  },
};

export class TasksService {
  async get() {
    try {
      const response = await prisma.task.findMany({
        include: taskInclude,
        where: { isArchived: false },
      });
      if (!response || response.length === 0) {
        return standardiseResponse({
          message: "No tasks found",
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: "List all tasks",
        httpStatus: 200,
        data: normalizeManyTasksWithDetails(response),
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching tasks",
        httpStatus: 500,
        error,
      });
    }
  }

  async create(data: CreateTaskInput) {
    const title = data.title?.trim();
    const creatorId = data.creatorId?.trim();
    const description =
      data.description === null
        ? null
        : data.description !== undefined
          ? data.description.trim()
          : undefined;
    const parentId =
      data.parentId === null
        ? null
        : data.parentId !== undefined
          ? data.parentId.trim()
          : undefined;
    const priorityId =
      data.priorityId === null
        ? null
        : data.priorityId !== undefined
          ? data.priorityId.trim()
          : undefined;
    const statusId =
      data.statusId === null
        ? null
        : data.statusId !== undefined
          ? data.statusId.trim()
          : undefined;
    const projectId =
      data.projectId === null
        ? null
        : data.projectId !== undefined
          ? data.projectId.trim()
          : undefined;

    if (!title) {
      return standardiseResponse({
        message: "title is required",
        httpStatus: 400,
      });
    }

    if (!creatorId) {
      return standardiseResponse({
        message: "creatorId is required",
        httpStatus: 400,
      });
    }

    if (
      data.description !== undefined &&
      description !== null &&
      !description
    ) {
      return standardiseResponse({
        message: "description cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.parentId !== undefined && parentId !== null && !parentId) {
      return standardiseResponse({
        message: "parentId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.priorityId !== undefined && priorityId !== null && !priorityId) {
      return standardiseResponse({
        message: "priorityId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.statusId !== undefined && statusId !== null && !statusId) {
      return standardiseResponse({
        message: "statusId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.projectId !== undefined && projectId !== null && !projectId) {
      return standardiseResponse({
        message: "projectId cannot be empty",
        httpStatus: 400,
      });
    }

    const startDate =
      data.startDate !== undefined && data.startDate !== null
        ? new Date(data.startDate)
        : data.startDate;
    const dueDate =
      data.dueDate !== undefined && data.dueDate !== null
        ? new Date(data.dueDate)
        : data.dueDate;

    if (startDate instanceof Date && Number.isNaN(startDate.getTime())) {
      return standardiseResponse({
        message: "startDate must be a valid date",
        httpStatus: 400,
      });
    }

    if (dueDate instanceof Date && Number.isNaN(dueDate.getTime())) {
      return standardiseResponse({
        message: "dueDate must be a valid date",
        httpStatus: 400,
      });
    }

    if (
      startDate instanceof Date &&
      dueDate instanceof Date &&
      dueDate.getTime() < startDate.getTime()
    ) {
      return standardiseResponse({
        message: "dueDate cannot be before startDate",
        httpStatus: 400,
      });
    }

    if (
      data.estimatedHours !== undefined &&
      data.estimatedHours !== null &&
      (!Number.isFinite(data.estimatedHours) || data.estimatedHours < 0)
    ) {
      return standardiseResponse({
        message: "estimatedHours must be a non-negative number",
        httpStatus: 400,
      });
    }

    if (data.isArchived !== undefined && typeof data.isArchived !== "boolean") {
      return standardiseResponse({
        message: "isArchived must be a boolean",
        httpStatus: 400,
      });
    }

    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!creator) {
        return standardiseResponse({
          message: `User with ID ${creatorId} not found`,
          httpStatus: 404,
        });
      }

      if (parentId) {
        const parent = await prisma.task.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          return standardiseResponse({
            message: `Task with ID ${parentId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (priorityId) {
        const priority = await prisma.priority.findUnique({
          where: { id: priorityId },
        });
        if (!priority) {
          return standardiseResponse({
            message: `Priority with ID ${priorityId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (statusId) {
        const status = await prisma.status.findUnique({
          where: { id: statusId },
        });
        if (!status) {
          return standardiseResponse({
            message: `Status with ID ${statusId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          return standardiseResponse({
            message: `Project with ID ${projectId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.task.create({
        data: {
          title,
          creatorId,
          ...(description !== undefined ? { description } : {}),
          ...(parentId !== undefined ? { parentId } : {}),
          ...(priorityId !== undefined ? { priorityId } : {}),
          ...(statusId !== undefined ? { statusId } : {}),
          ...(projectId !== undefined ? { projectId } : {}),
          ...(startDate !== undefined ? { startDate } : {}),
          ...(dueDate !== undefined ? { dueDate } : {}),
          ...(data.estimatedHours !== undefined
            ? { estimatedHours: data.estimatedHours }
            : {}),
          ...(data.isArchived !== undefined
            ? { isArchived: data.isArchived }
            : {}),
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: "Create a task",
        httpStatus: 201,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Task already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while creating task",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: "Error creating task",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.task.findUnique({
        where: { id },
        include: taskInclude,
      });
      if (!response) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get task by ID: ${id}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: UpdateTaskInput) {
    const title = data.title?.trim();
    const creatorId =
      data.creatorId !== undefined ? data.creatorId?.trim() : undefined;
    const description =
      data.description === null
        ? null
        : data.description !== undefined
          ? data.description.trim()
          : undefined;
    const parentId =
      data.parentId === null
        ? null
        : data.parentId !== undefined
          ? data.parentId.trim()
          : undefined;
    const priorityId =
      data.priorityId === null
        ? null
        : data.priorityId !== undefined
          ? data.priorityId.trim()
          : undefined;
    const statusId =
      data.statusId === null
        ? null
        : data.statusId !== undefined
          ? data.statusId.trim()
          : undefined;
    const projectId =
      data.projectId === null
        ? null
        : data.projectId !== undefined
          ? data.projectId.trim()
          : undefined;

    const hasAnyUpdateField =
      data.title !== undefined ||
      data.description !== undefined ||
      data.parentId !== undefined ||
      data.creatorId !== undefined ||
      data.priorityId !== undefined ||
      data.statusId !== undefined ||
      data.projectId !== undefined ||
      data.startDate !== undefined ||
      data.dueDate !== undefined ||
      data.estimatedHours !== undefined ||
      data.isArchived !== undefined;

    if (!hasAnyUpdateField) {
      return standardiseResponse({
        message: "At least one field is required to update a task",
        httpStatus: 400,
      });
    }

    if (data.title !== undefined && !title) {
      return standardiseResponse({
        message: "title cannot be empty",
        httpStatus: 400,
      });
    }

    if (
      data.description !== undefined &&
      description !== null &&
      !description
    ) {
      return standardiseResponse({
        message: "description cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.creatorId !== undefined && !creatorId) {
      return standardiseResponse({
        message: "creatorId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.parentId !== undefined && parentId !== null && !parentId) {
      return standardiseResponse({
        message: "parentId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.priorityId !== undefined && priorityId !== null && !priorityId) {
      return standardiseResponse({
        message: "priorityId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.statusId !== undefined && statusId !== null && !statusId) {
      return standardiseResponse({
        message: "statusId cannot be empty",
        httpStatus: 400,
      });
    }

    if (data.projectId !== undefined && projectId !== null && !projectId) {
      return standardiseResponse({
        message: "projectId cannot be empty",
        httpStatus: 400,
      });
    }

    const startDate =
      data.startDate !== undefined && data.startDate !== null
        ? new Date(data.startDate)
        : data.startDate;
    const dueDate =
      data.dueDate !== undefined && data.dueDate !== null
        ? new Date(data.dueDate)
        : data.dueDate;

    if (startDate instanceof Date && Number.isNaN(startDate.getTime())) {
      return standardiseResponse({
        message: "startDate must be a valid date",
        httpStatus: 400,
      });
    }

    if (dueDate instanceof Date && Number.isNaN(dueDate.getTime())) {
      return standardiseResponse({
        message: "dueDate must be a valid date",
        httpStatus: 400,
      });
    }

    if (
      startDate instanceof Date &&
      dueDate instanceof Date &&
      dueDate.getTime() < startDate.getTime()
    ) {
      return standardiseResponse({
        message: "dueDate cannot be before startDate",
        httpStatus: 400,
      });
    }

    if (
      data.estimatedHours !== undefined &&
      data.estimatedHours !== null &&
      (!Number.isFinite(data.estimatedHours) || data.estimatedHours < 0)
    ) {
      return standardiseResponse({
        message: "estimatedHours must be a non-negative number",
        httpStatus: 400,
      });
    }

    if (data.isArchived !== undefined && typeof data.isArchived !== "boolean") {
      return standardiseResponse({
        message: "isArchived must be a boolean",
        httpStatus: 400,
      });
    }

    try {
      const existing = await prisma.task.findUnique({ where: { id } });

      if (!existing) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      if (creatorId) {
        const creator = await prisma.user.findUnique({
          where: { id: creatorId },
        });

        if (!creator) {
          return standardiseResponse({
            message: `User with ID ${creatorId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (parentId) {
        if (parentId === id) {
          return standardiseResponse({
            message: "parentId cannot be the same as task id",
            httpStatus: 400,
          });
        }

        const parentTask = await prisma.task.findUnique({
          where: { id: parentId },
        });
        if (!parentTask) {
          return standardiseResponse({
            message: `Task with ID ${parentId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (priorityId) {
        const priority = await prisma.priority.findUnique({
          where: { id: priorityId },
        });
        if (!priority) {
          return standardiseResponse({
            message: `Priority with ID ${priorityId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (statusId) {
        const status = await prisma.status.findUnique({
          where: { id: statusId },
        });
        if (!status) {
          return standardiseResponse({
            message: `Status with ID ${statusId} not found`,
            httpStatus: 404,
          });
        }
      }

      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          return standardiseResponse({
            message: `Project with ID ${projectId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.task.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(creatorId !== undefined ? { creatorId } : {}),
          ...(parentId !== undefined ? { parentId } : {}),
          ...(priorityId !== undefined ? { priorityId } : {}),
          ...(statusId !== undefined ? { statusId } : {}),
          ...(projectId !== undefined ? { projectId } : {}),
          ...(startDate !== undefined ? { startDate } : {}),
          ...(dueDate !== undefined ? { dueDate } : {}),
          ...(data.estimatedHours !== undefined
            ? { estimatedHours: data.estimatedHours }
            : {}),
          ...(data.isArchived !== undefined
            ? { isArchived: data.isArchived }
            : {}),
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Update task with ID: ${id}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "Task already exists",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: "Invalid reference while updating task",
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error updating task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      await prisma.task.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete task with ID: ${id}`,
        httpStatus: 200,
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error deleting task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async addLabels(taskId: string, labelIds: string[]) {
    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return standardiseResponse({
        message: "labelIds must be a non-empty array",
        httpStatus: 400,
      });
    }

    const normalizedLabelIds = labelIds.map((id) => id?.trim());
    if (normalizedLabelIds.some((id) => !id)) {
      return standardiseResponse({
        message: "labelIds must contain only non-empty strings",
        httpStatus: 400,
      });
    }

    const uniqueLabelIds = [...new Set(normalizedLabelIds)] as string[];

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const existingLabels = await prisma.label.findMany({
        where: {
          id: {
            in: uniqueLabelIds,
          },
        },
        select: { id: true },
      });

      const existingLabelIdSet = new Set(
        existingLabels.map((label) => label.id),
      );
      const missingLabelIds = uniqueLabelIds.filter(
        (labelId) => !existingLabelIdSet.has(labelId),
      );

      if (missingLabelIds.length > 0) {
        return standardiseResponse({
          message: `Labels not found: ${missingLabelIds.join(", ")}`,
          httpStatus: 404,
        });
      }

      const existingLinks = await prisma.taskLabel.findMany({
        where: {
          taskId,
          labelId: {
            in: uniqueLabelIds,
          },
        },
        select: { labelId: true },
      });

      if (existingLinks.length > 0) {
        return standardiseResponse({
          message: `Labels already assigned to task ${taskId}: ${existingLinks
            .map((link) => link.labelId)
            .join(", ")}`,
          httpStatus: 409,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          labelLinks: {
            create: uniqueLabelIds.map((id) => ({
              label: {
                connect: { id },
              },
            })),
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Add labels to task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: "One or more labels are already assigned to this task",
          httpStatus: 409,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid reference while adding labels to task ${taskId}`,
          httpStatus: 400,
        });
      }

      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error adding labels to task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async removeLabels(taskId: string, labelIds: string[]) {
    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return standardiseResponse({
        message: "labelIds must be a non-empty array",
        httpStatus: 400,
      });
    }

    const normalizedLabelIds = labelIds.map((id) => id?.trim());
    if (normalizedLabelIds.some((id) => !id)) {
      return standardiseResponse({
        message: "labelIds must contain only non-empty strings",
        httpStatus: 400,
      });
    }

    const uniqueLabelIds = [...new Set(normalizedLabelIds)] as string[];

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          labelLinks: {
            deleteMany: {
              labelId: {
                in: uniqueLabelIds,
              },
            },
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Remove labels from task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error removing labels from task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async setPriority(taskId: string, priorityId: string | null) {
    if (priorityId === undefined) {
      return standardiseResponse({
        message: "priorityId is required",
        httpStatus: 400,
      });
    }

    const normalizedPriorityId = priorityId === null ? null : priorityId.trim();

    if (priorityId !== null && !normalizedPriorityId) {
      return standardiseResponse({
        message: "priorityId cannot be empty",
        httpStatus: 400,
      });
    }

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (normalizedPriorityId) {
        const priority = await prisma.priority.findUnique({
          where: { id: normalizedPriorityId },
        });
        if (!priority) {
          return standardiseResponse({
            message: `Priority with ID ${normalizedPriorityId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          priority: normalizedPriorityId
            ? { connect: { id: normalizedPriorityId } }
            : { disconnect: true },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Set priority for task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid priority reference for task ${taskId}`,
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error setting priority for task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async setStatus(taskId: string, statusId: string | null) {
    if (statusId === undefined) {
      return standardiseResponse({
        message: "statusId is required",
        httpStatus: 400,
      });
    }

    const normalizedStatusId = statusId === null ? null : statusId.trim();

    if (statusId !== null && !normalizedStatusId) {
      return standardiseResponse({
        message: "statusId cannot be empty",
        httpStatus: 400,
      });
    }

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (normalizedStatusId) {
        const status = await prisma.status.findUnique({
          where: { id: normalizedStatusId },
        });
        if (!status) {
          return standardiseResponse({
            message: `Status with ID ${normalizedStatusId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: normalizedStatusId
            ? { connect: { id: normalizedStatusId } }
            : { disconnect: true },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Set status for task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid status reference for task ${taskId}`,
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error setting status for task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async assignProject(taskId: string, projectId: string) {
    const normalizedProjectId = projectId?.trim();

    try {
      if (!normalizedProjectId) {
        return standardiseResponse({
          message: "projectId is required",
          httpStatus: 400,
        });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: normalizedProjectId },
      });
      if (!project) {
        return standardiseResponse({
          message: `Project with ID ${normalizedProjectId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          project: {
            connect: { id: normalizedProjectId },
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Assign project ${normalizedProjectId} to task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid project reference for task ${taskId}`,
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error assigning project ${normalizedProjectId} to task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unassignProject(taskId: string) {
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          project: {
            disconnect: true,
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Unassign project from task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unassigning project from task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async archive(id: string) {
    try {
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id },
        data: { isArchived: true },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Archive task with ID: ${id}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error archiving task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unarchive(id: string) {
    try {
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id },
        data: { isArchived: false },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Unarchive task with ID: ${id}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unarchiving task with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async assignUser(taskId: string, userId: string) {
    const normalizedUserId = userId?.trim();

    try {
      if (!normalizedUserId) {
        return standardiseResponse({
          message: "userId is required",
          httpStatus: 400,
        });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          assignees: {
            connect: { userId_taskId: { userId: normalizedUserId, taskId } },
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Assign user ${normalizedUserId} to task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: `User ${normalizedUserId} is already assigned to task ${taskId}`,
          httpStatus: 409,
        });
      }

      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid user reference while assigning to task ${taskId}`,
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error assigning user ${normalizedUserId} to task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unassignUser(taskId: string, userId: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      return standardiseResponse({
        message: "userId is required",
        httpStatus: 400,
      });
    }

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          assignees: {
            disconnect: { userId_taskId: { userId: normalizedUserId, taskId } },
          },
        },
        include: taskInclude,
      });
      return standardiseResponse({
        message: `Unassign user ${normalizedUserId} from task ${taskId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unassigning user ${normalizedUserId} from task ${taskId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async watchTask(taskId: string, userId: string) {
    const normalizedUserId = userId?.trim();

    try {
      if (!normalizedUserId) {
        return standardiseResponse({
          message: "userId is required",
          httpStatus: 400,
        });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          watchers: {
            connect: { userId_taskId: { userId: normalizedUserId, taskId } },
          },
        },
        include: taskInclude,
      });

      return standardiseResponse({
        message: `Watch task ${taskId} as user ${normalizedUserId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaConflictError(error)) {
        return standardiseResponse({
          message: `User ${normalizedUserId} is already watching task ${taskId}`,
          httpStatus: 409,
        });
      }

      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      if (isPrismaForeignKeyError(error)) {
        return standardiseResponse({
          message: `Invalid user reference while watching task ${taskId}`,
          httpStatus: 400,
        });
      }

      return standardiseResponse({
        message: `Error watching task ${taskId} as user ${normalizedUserId}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async unwatchTask(taskId: string, userId: string) {
    const normalizedUserId = userId?.trim();

    try {
      if (!normalizedUserId) {
        return standardiseResponse({
          message: "userId is required",
          httpStatus: 400,
        });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
      });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${normalizedUserId} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.task.update({
        where: { id: taskId },
        data: {
          watchers: {
            disconnect: {
              userId_taskId: { userId: normalizedUserId, taskId },
            },
          },
        },
        include: taskInclude,
      });

      return standardiseResponse({
        message: `Unwatch task ${taskId} as user ${normalizedUserId}`,
        httpStatus: 200,
        data: normalizeTaskWithDetails(response),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      return standardiseResponse({
        message: `Error unwatching task ${taskId} as user ${normalizedUserId}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
