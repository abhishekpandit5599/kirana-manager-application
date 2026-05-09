import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";
import { getShop } from "../../middlewares/auth.middleware";

import { sendSuccess } from "../../utils/response";
import { SUCCESS_MESSAGES } from "../../utils/messages";

export const reportsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getDashboard(getShop(req).id);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Dashboard data"));
    } catch (err) { next(err); }
  },
  async salesAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getSalesAnalytics(getShop(req).id, req.query.period as string);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Sales analytics"));
    } catch (err) { next(err); }
  },
  async topItems(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getTopItems(getShop(req).id);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Top items"));
    } catch (err) { next(err); }
  },
  async dailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getDailyReport(getShop(req).id, req.query.date as string);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Daily report"));
    } catch (err) { next(err); }
  },
};
