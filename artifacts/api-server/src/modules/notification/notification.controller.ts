import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { getShop } from "../../middlewares/auth.middleware";

import { sendSuccess } from "../../utils/response";
import { SUCCESS_MESSAGES } from "../../utils/messages";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = getShop(req).id;
      const notifications = await notificationService.listNotifications(shopId, req.query);
      sendSuccess(res, notifications, SUCCESS_MESSAGES.FETCHED("Notifications"));
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const n = await notificationService.createNotification(shop.id, req.body.type, req.body.title, req.body.message);
      sendSuccess(res, n, SUCCESS_MESSAGES.CREATED("Notification"), 201);
    } catch (err) { next(err); }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const n = await notificationService.markAsRead((req.params.id as string), getShop(req).id);
      sendSuccess(res, n, SUCCESS_MESSAGES.MARKED_READ);
    } catch (err) { next(err); }
  },
  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(getShop(req).id);
      sendSuccess(res, null, SUCCESS_MESSAGES.ALL_MARKED_READ);
    } catch (err) { next(err); }
  },
};
