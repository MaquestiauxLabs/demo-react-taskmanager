import { Request, Response } from "express";
import { ProjectsService } from "../services";

export class ProjectsController {
  private service: ProjectsService;

  constructor() {
    this.service = new ProjectsService();
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
}
