import { Request, Response } from "express";
import { PrioritiesService } from "../services";

export class PrioritiesController {
  private service: PrioritiesService;

  constructor() {
    this.service = new PrioritiesService();
  }

  get = async (req: Request, res: Response) => {
    const result = await this.service.get();
    res.json(result);
  };

  create = async (req: Request, res: Response) => {
    const result = await this.service.create(req.body);
    res.json(result);
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getById(id as string);
    res.json(result);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.update(id as string, req.body);
    res.json(result);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.delete(id as string);
    res.json(result);
  };
}
