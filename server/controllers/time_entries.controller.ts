import { Request, Response } from "express";
import { TimeEntriesService } from "../services";

export class TimeEntriesController {
  private service: TimeEntriesService;

  constructor() {
    this.service = new TimeEntriesService();
  }

  getByTaskId = async (req: Request, res: Response) => {
    const taskId = req.params.taskId ?? req.params.id;
    const result = await this.service.getByTaskId(taskId as string);
    res.status(result.httpStatus).json(result);
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getById(id as string);
    res.status(result.httpStatus).json(result);
  };

  create = async (req: Request, res: Response) => {
    const taskId = req.params.taskId ?? req.params.id;
    const result = await this.service.create(taskId as string, req.body);
    res.status(result.httpStatus).json(result);
  };

  startTimer = async (req: Request, res: Response) => {
    const taskId = req.params.taskId ?? req.params.id;
    const { creatorId } = req.body;
    const result = await this.service.startTimer(taskId as string, creatorId);
    res.status(result.httpStatus).json(result);
  };

  stopTimer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.stopTimer(id as string);
    res.status(result.httpStatus).json(result);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.update(id as string, req.body);
    res.status(result.httpStatus).json(result);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.delete(id as string);
    res.status(result.httpStatus).json(result);
  };
}
