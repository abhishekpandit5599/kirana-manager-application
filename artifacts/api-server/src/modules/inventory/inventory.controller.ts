import { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service";
import { getShop } from "../../middlewares/auth.middleware";

export const inventoryController = {
  async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const { category, lowStock } = req.query as { category?: string; lowStock?: string };
      const items = await inventoryService.listItems(shop.id, category, lowStock);
      res.json(items);
    } catch (err) { next(err); }
  },

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.getItem(req.params.id, shop.id);
      res.json(item);
    } catch (err) { next(err); }
  },

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.createItem(shop.id, req.body);
      res.status(201).json(item);
    } catch (err) { next(err); }
  },

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.updateItem(req.params.id, shop.id, req.body);
      res.json(item);
    } catch (err) { next(err); }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      await inventoryService.deleteItem(req.params.id, shop.id);
      res.sendStatus(204);
    } catch (err) { next(err); }
  },

  async getDefaultItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await inventoryService.getDefaultItems();
      res.json(items);
    } catch (err) { next(err); }
  },

  async addDefaultItems(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await inventoryService.addDefaultItems(shop.id, req.body.items);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const wb = await inventoryService.generateExcelTemplate();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="inventory_template.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  },

  async importExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const mode = (req.body.mode || "update") as "create" | "update";
      if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
      const result = await inventoryService.importExcel(shop.id, req.file.buffer, mode);
      res.json(result);
    } catch (err) { next(err); }
  },

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const wb = await inventoryService.exportExcel(shop.id);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="inventory.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  },
};
