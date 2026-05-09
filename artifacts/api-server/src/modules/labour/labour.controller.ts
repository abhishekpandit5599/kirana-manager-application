import { Request, Response, NextFunction } from "express";
import { labourService } from "./labour.service";
import { getShop } from "../../middlewares/auth.middleware";
import { sendSuccess } from "../../utils/response";
import { SUCCESS_MESSAGES } from "../../utils/messages";

export const labourController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.list(getShop(req).id);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Labour list"));
    } catch (e) { next(e); }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.get((req.params.id as string), getShop(req).id);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Labour details"));
    } catch (e) { next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.create(getShop(req).id, req.body);
      sendSuccess(res, data, SUCCESS_MESSAGES.CREATED("Labour"), 201);
    } catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.update((req.params.id as string), getShop(req).id, req.body);
      sendSuccess(res, data, SUCCESS_MESSAGES.UPDATED("Labour"));
    } catch (e) { next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await labourService.remove((req.params.id as string), getShop(req).id);
      sendSuccess(res, null, SUCCESS_MESSAGES.DELETED("Labour"));
    } catch (e) { next(e); }
  },
  async salary(req: Request, res: Response, next: NextFunction) {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const data = await labourService.getSalary((req.params.id as string), getShop(req).id, month);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Salary details"));
    } catch (e) { next(e); }
  },
  async listAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.listAttendance(getShop(req).id, req.query.labourId as string, req.query.month as string);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Attendance list"));
    } catch (e) { next(e); }
  },
  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labourService.markAttendance(getShop(req).id, req.body.labourId, req.body.date, req.body.status);
      sendSuccess(res, data, SUCCESS_MESSAGES.ATTENDANCE_MARKED, 201);
    } catch (e) { next(e); }
  },
};
