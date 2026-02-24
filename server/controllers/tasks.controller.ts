import { Request, Response } from "express";
import { TasksService } from "../services";

export class TasksController {
  private service: TasksService;

  constructor() {
    this.service = new TasksService();
  }

  get = async (req: Request, res: Response) => {
    const result = await this.service.get();
    res.status(result.httpStatus).json(result);
  };

  create = async (req: Request, res: Response) => {
    const result = await this.service.create(req.body);
    res.status(result.httpStatus).json(result);
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getById(id as string);
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

  addLabels = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { labelIds } = req.body;
    const result = await this.service.addLabels(id as string, labelIds);
    res.status(result.httpStatus).json(result);
  };

  removeLabels = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { labelIds } = req.body;
    const result = await this.service.removeLabels(id as string, labelIds);
    res.status(result.httpStatus).json(result);
  };

  setPriority = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { priorityId } = req.body;
    const result = await this.service.setPriority(id as string, priorityId);
    res.status(result.httpStatus).json(result);
  };

  setStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { statusId } = req.body;
    const result = await this.service.setStatus(id as string, statusId);
    res.status(result.httpStatus).json(result);
  };

  assignProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { projectId } = req.body;
    const result = await this.service.assignProject(id as string, projectId);
    res.status(result.httpStatus).json(result);
  };

  unassignProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.unassignProject(id as string);
    res.status(result.httpStatus).json(result);
  };
}
