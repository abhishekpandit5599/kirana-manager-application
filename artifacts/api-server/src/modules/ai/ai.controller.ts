import { Request, Response, NextFunction } from "express";
import { aiService } from "./ai.service";
import { getShop } from "../../middlewares/auth.middleware";
import fs from "fs";

export const aiController = {
  async processOcr(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      let imageBuffer: Buffer | undefined;

      if (req.file) {
        imageBuffer = req.file.buffer;
      } else if (req.body.imageBase64) {
        imageBuffer = Buffer.from(req.body.imageBase64, "base64");
      }

      const result = await aiService.processOcr(shop.id, req.body.imageBase64, imageBuffer);
      res.json(result);
    } catch (err) { next(err); }
  },

  async processVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await aiService.processVoice(shop.id, req.body.text);
      res.json(result);
    } catch (err) { next(err); }
  },
};
