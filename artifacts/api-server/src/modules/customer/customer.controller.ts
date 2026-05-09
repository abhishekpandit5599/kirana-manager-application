import { Request, Response, NextFunction } from "express";
import { customerService } from "./customer.service";
import { getShop } from "../../middlewares/auth.middleware";
import { sendSuccess } from "../../utils/response";
import { SUCCESS_MESSAGES } from "../../utils/messages";

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await customerService.listCustomers(getShop(req).id, req.query);
      sendSuccess(res, customers, SUCCESS_MESSAGES.FETCHED("Customers"));
    } catch (err) { next(err); }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.getCustomer((req.params.id as string), getShop(req).id);
      sendSuccess(res, customer, SUCCESS_MESSAGES.FETCHED("Customer"));
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.createCustomer(getShop(req).id, req.body);
      sendSuccess(res, customer, SUCCESS_MESSAGES.CREATED("Customer"), 201);
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.updateCustomer((req.params.id as string), getShop(req).id, req.body);
      sendSuccess(res, customer, SUCCESS_MESSAGES.UPDATED("Customer"));
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.deleteCustomer((req.params.id as string), getShop(req).id);
      sendSuccess(res, null, SUCCESS_MESSAGES.DELETED("Customer"));
    } catch (err) { next(err); }
  },
  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await customerService.getCustomerStats((req.params.id as string), getShop(req).id);
      sendSuccess(res, stats, SUCCESS_MESSAGES.FETCHED("Customer stats"));
    } catch (err) { next(err); }
  },
};
