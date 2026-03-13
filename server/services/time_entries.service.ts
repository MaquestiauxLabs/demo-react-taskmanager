import {
  TimeEntryCreateInput,
  TimeEntryUpdateInput,
} from "../prisma/generated/models";
import { prisma, standardiseResponse } from "../utils";

const timeEntryInclude = {
  creator: true,
  task: true,
};

export class TimeEntriesService {
  async getByTaskId(taskId: string) {
    try {
      const response = await prisma.timeEntry.findMany({
        where: { taskId },
        include: timeEntryInclude,
      });
      return standardiseResponse({
        message: `List time entries for task ${taskId}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error fetching time entries",
        httpStatus: 500,
        error,
      });
    }
  }

  async getById(id: string) {
    try {
      const response = await prisma.timeEntry.findUnique({
        where: { id },
        include: timeEntryInclude,
      });
      if (!response) {
        return standardiseResponse({
          message: `Time entry with ID ${id} not found`,
          httpStatus: 404,
        });
      }
      return standardiseResponse({
        message: `Get time entry by ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error fetching time entry with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async create(taskId: string, data: TimeEntryCreateInput) {
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const { creatorId, ...restData } = data as TimeEntryCreateInput & {
        creatorId?: string;
      };
      if (creatorId) {
        const user = await prisma.user.findUnique({ where: { id: creatorId } });
        if (!user) {
          return standardiseResponse({
            message: `User with ID ${creatorId} not found`,
            httpStatus: 404,
          });
        }
      }

      const response = await prisma.timeEntry.create({
        data: {
          ...restData,
          task: { connect: { id: taskId } },
          ...(creatorId && { creator: { connect: { id: creatorId } } }),
        },
        include: timeEntryInclude,
      });
      return standardiseResponse({
        message: "Create time entry",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error creating time entry",
        httpStatus: 500,
        error,
      });
    }
  }

  async startTimer(taskId: string, creatorId: string) {
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return standardiseResponse({
          message: `Task with ID ${taskId} not found`,
          httpStatus: 404,
        });
      }

      const user = await prisma.user.findUnique({ where: { id: creatorId } });
      if (!user) {
        return standardiseResponse({
          message: `User with ID ${creatorId} not found`,
          httpStatus: 404,
        });
      }

      const existingRunning = await prisma.timeEntry.findFirst({
        where: { taskId, endDate: null },
      });
      if (existingRunning) {
        return standardiseResponse({
          message: "A timer is already running for this task",
          httpStatus: 400,
        });
      }

      const response = await prisma.timeEntry.create({
        data: {
          task: { connect: { id: taskId } },
          creator: { connect: { id: creatorId } },
          startDate: new Date(),
          duration: 0,
        },
        include: timeEntryInclude,
      });
      return standardiseResponse({
        message: "Timer started",
        httpStatus: 201,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error starting timer",
        httpStatus: 500,
        error,
      });
    }
  }

  async stopTimer(id: string) {
    try {
      const timeEntry = await prisma.timeEntry.findUnique({ where: { id } });
      if (!timeEntry) {
        return standardiseResponse({
          message: `Time entry with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      if (timeEntry.endDate) {
        return standardiseResponse({
          message: "Timer already stopped",
          httpStatus: 400,
        });
      }

      const endDate = new Date();
      const startDate = new Date(timeEntry.startDate);
      const durationHours =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

      const response = await prisma.timeEntry.update({
        where: { id },
        data: {
          endDate,
          duration: durationHours,
        },
        include: timeEntryInclude,
      });
      return standardiseResponse({
        message: "Timer stopped",
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: "Error stopping timer",
        httpStatus: 500,
        error,
      });
    }
  }

  async update(id: string, data: TimeEntryUpdateInput) {
    try {
      const timeEntry = await prisma.timeEntry.findUnique({ where: { id } });
      if (!timeEntry) {
        return standardiseResponse({
          message: `Time entry with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.timeEntry.update({
        where: { id },
        data,
        include: timeEntryInclude,
      });
      return standardiseResponse({
        message: `Update time entry with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error updating time entry with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }

  async delete(id: string) {
    try {
      const existing = await prisma.timeEntry.findUnique({ where: { id } });
      if (!existing) {
        return standardiseResponse({
          message: `Time entry with ID ${id} not found`,
          httpStatus: 404,
        });
      }

      const response = await prisma.timeEntry.delete({ where: { id } });
      return standardiseResponse({
        message: `Delete time entry with ID: ${id}`,
        httpStatus: 200,
        data: response,
      });
    } catch (error) {
      return standardiseResponse({
        message: `Error deleting time entry with ID ${id}`,
        httpStatus: 500,
        error,
      });
    }
  }
}
