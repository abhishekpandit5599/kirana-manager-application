import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { getShop } from "../../middlewares/auth.middleware";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await notificationService.listNotifications(getShop(req).id)); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      res.status(201).json(await notificationService.createNotification(shop.id, req.body.type, req.body.title, req.body.message));
    } catch (err) { next(err); }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try { res.json(await notificationService.markAsRead((req.params.id as string), getShop(req).id)); } catch (err) { next(err); }
  },
};
