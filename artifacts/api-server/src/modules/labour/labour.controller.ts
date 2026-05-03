import { Request, Response, NextFunction } from "express";
import { labourService } from "./labour.service";
import { getShop } from "../../middlewares/auth.middleware";

export const labourController = {
  async list(req: Request, res: Response, next: NextFunction) { try { res.json(await labourService.list(getShop(req).id)); } catch (e) { next(e); } },
  async get(req: Request, res: Response, next: NextFunction) { try { res.json(await labourService.get(req.params.id, getShop(req).id)); } catch (e) { next(e); } },
  async create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await labourService.create(getShop(req).id, req.body)); } catch (e) { next(e); } },
  async update(req: Request, res: Response, next: NextFunction) { try { res.json(await labourService.update(req.params.id, getShop(req).id, req.body)); } catch (e) { next(e); } },
  async remove(req: Request, res: Response, next: NextFunction) { try { await labourService.remove(req.params.id, getShop(req).id); res.sendStatus(204); } catch (e) { next(e); } },
  async salary(req: Request, res: Response, next: NextFunction) {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      res.json(await labourService.getSalary(req.params.id, getShop(req).id, month));
    } catch (e) { next(e); }
  },
  async listAttendance(req: Request, res: Response, next: NextFunction) {
    try { res.json(await labourService.listAttendance(getShop(req).id, req.query.labourId as string, req.query.month as string)); } catch (e) { next(e); }
  },
  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await labourService.markAttendance(getShop(req).id, req.body.labourId, req.body.date, req.body.status)); } catch (e) { next(e); }
  },
};
