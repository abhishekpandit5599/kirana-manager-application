import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";
import { getShop } from "../../middlewares/auth.middleware";

export const reportsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try { res.json(await reportsService.getDashboard(getShop(req).id)); } catch (err) { next(err); }
  },
  async salesAnalytics(req: Request, res: Response, next: NextFunction) {
    try { res.json(await reportsService.getSalesAnalytics(getShop(req).id, req.query.period as string)); } catch (err) { next(err); }
  },
  async topItems(req: Request, res: Response, next: NextFunction) {
    try { res.json(await reportsService.getTopItems(getShop(req).id)); } catch (err) { next(err); }
  },
  async dailyReport(req: Request, res: Response, next: NextFunction) {
    try { res.json(await reportsService.getDailyReport(getShop(req).id, req.query.date as string)); } catch (err) { next(err); }
  },
};
