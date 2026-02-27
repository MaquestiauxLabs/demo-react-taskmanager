import { Request, Response } from "express";
import { CommentsService } from "../services";

export class CommentsController {
  private service: CommentsService;

  constructor() {
    this.service = new CommentsService();
  }

  getByTaskId = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const result = await this.service.getByTaskId(taskId as string);
    res.status(result.httpStatus).json(result);
  };

  getByProjectId = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const result = await this.service.getByProjectId(projectId as string);
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
    if (result.httpStatus === 204) {
      return res.status(204).send();
    }
    res.status(result.httpStatus).json(result);
  };
}
