import { Request, Response, NextFunction } from "express";
import { settingsService } from "./settings.service";
import { getShop } from "../../middlewares/auth.middleware";

export const settingsController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try { res.json(await settingsService.getSettings(getShop(req).id)); } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json(await settingsService.updateSettings(getShop(req).id, req.body)); } catch (err) { next(err); }
  },
  async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json(await settingsService.uploadLogo(getShop(req).id, fileUrl));
    } catch (err) { next(err); }
  },
  async deleteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await settingsService.uploadLogo(getShop(req).id, ""));
    } catch (err) { next(err); }
  },
  async uploadUpiQr(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json(await settingsService.uploadUpiQr(getShop(req).id, fileUrl));
    } catch (err) { next(err); }
  },
  async generateUpiQr(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings(getShop(req).id);
      if (!settings.upiId) { res.status(400).json({ error: "UPI ID not configured" }); return; }
      const amount = req.query.amount ? Number(req.query.amount) : undefined;
      const qr = await settingsService.generateUpiQr(settings.upiId, amount);
      res.json({ qrDataUrl: qr, upiId: settings.upiId, amount });
    } catch (err) { next(err); }
  },
};
