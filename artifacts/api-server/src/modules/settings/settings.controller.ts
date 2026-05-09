import { Request, Response, NextFunction } from "express";
import { settingsService } from "./settings.service";
import { getShop } from "../../middlewares/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../../utils/messages";

export const settingsController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getSettings(getShop(req).id);
      sendSuccess(res, data, SUCCESS_MESSAGES.FETCHED("Settings"));
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.updateSettings(getShop(req).id, req.body);
      sendSuccess(res, data, SUCCESS_MESSAGES.UPDATED("Settings"));
    } catch (err) { next(err); }
  },
  async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        sendError(res, ERROR_MESSAGES.NO_FILE_UPLOADED, 400);
        return;
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const data = await settingsService.uploadLogo(getShop(req).id, fileUrl);
      sendSuccess(res, data, SUCCESS_MESSAGES.LOGO_UPLOADED);
    } catch (err) { next(err); }
  },
  async deleteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.uploadLogo(getShop(req).id, "");
      sendSuccess(res, data, SUCCESS_MESSAGES.DELETED("Logo"));
    } catch (err) { next(err); }
  },
  async uploadUpiQr(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        sendError(res, ERROR_MESSAGES.NO_FILE_UPLOADED, 400);
        return;
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const data = await settingsService.uploadUpiQr(getShop(req).id, fileUrl);
      sendSuccess(res, data, SUCCESS_MESSAGES.UPI_QR_UPLOADED);
    } catch (err) { next(err); }
  },
  async generateUpiQr(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings(getShop(req).id);
      if (!settings.upiId) {
        sendError(res, ERROR_MESSAGES.UPI_ID_NOT_CONFIGURED, 400);
        return;
      }
      const amount = req.query.amount ? Number(req.query.amount) : undefined;
      const qr = await settingsService.generateUpiQr(settings.upiId, amount);
      sendSuccess(res, { qrDataUrl: qr, upiId: settings.upiId, amount }, SUCCESS_MESSAGES.UPI_QR_GENERATED);
    } catch (err) { next(err); }
  },
};
