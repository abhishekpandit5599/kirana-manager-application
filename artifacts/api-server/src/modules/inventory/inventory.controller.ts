import { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service";
import { getShop } from "../../middlewares/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../../utils/messages";

export const inventoryController = {
  async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const items = await inventoryService.listItems(shop.id, req.query);
      sendSuccess(res, items, SUCCESS_MESSAGES.FETCHED("Items"));
    } catch (err) { next(err); }
  },

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.getItem((req.params.id as string), shop.id);
      sendSuccess(res, item, SUCCESS_MESSAGES.FETCHED("Item"));
    } catch (err) { next(err); }
  },

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.createItem(shop.id, req.body);
      sendSuccess(res, item, SUCCESS_MESSAGES.CREATED("Item"), 201);
    } catch (err) { next(err); }
  },

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const item = await inventoryService.updateItem((req.params.id as string), shop.id, req.body);
      sendSuccess(res, item, SUCCESS_MESSAGES.UPDATED("Item"));
    } catch (err) { next(err); }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      await inventoryService.deleteItem((req.params.id as string), shop.id);
      sendSuccess(res, null, SUCCESS_MESSAGES.DELETED("Item"), 200);
    } catch (err) { next(err); }
  },

  async getDefaultItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await inventoryService.getDefaultItems(req.query);
      sendSuccess(res, items, SUCCESS_MESSAGES.FETCHED("Default items"));
    } catch (err) { next(err); }
  },

  async addDefaultItems(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await inventoryService.addDefaultItems(shop.id, req.body.items);
      sendSuccess(res, result, SUCCESS_MESSAGES.CREATED("Default items"), 201);
    } catch (err) { next(err); }
  },

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const categories = await inventoryService.getCategories(shop.id);
      sendSuccess(res, categories, SUCCESS_MESSAGES.FETCHED("Categories"));
    } catch (err) { next(err); }
  },

  async getDefaultCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await inventoryService.getDefaultCategories();
      sendSuccess(res, categories, SUCCESS_MESSAGES.FETCHED("Default categories"));
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
      if (!req.file) { sendError(res, ERROR_MESSAGES.NO_FILE_UPLOADED, 400); return; }
      const result = await inventoryService.importExcel(shop.id, req.file.buffer, mode);
      sendSuccess(res, result, SUCCESS_MESSAGES.UPDATED("Inventory"));
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
