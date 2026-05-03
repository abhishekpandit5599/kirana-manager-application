import { Request, Response, NextFunction } from "express";
import { customerService } from "./customer.service";
import { getShop } from "../../middlewares/auth.middleware";

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await customerService.listCustomers(getShop(req).id, req.query.search as string)); } catch (err) { next(err); }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try { res.json(await customerService.getCustomer((req.params.id as string), getShop(req).id)); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await customerService.createCustomer(getShop(req).id, req.body)); } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json(await customerService.updateCustomer((req.params.id as string), getShop(req).id, req.body)); } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await customerService.deleteCustomer((req.params.id as string), getShop(req).id); res.sendStatus(204); } catch (err) { next(err); }
  },
  async stats(req: Request, res: Response, next: NextFunction) {
    try { res.json(await customerService.getCustomerStats((req.params.id as string), getShop(req).id)); } catch (err) { next(err); }
  },
};
