import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const authController = {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtp(req.body.email);
      res.json(result);
    } catch (err) { next(err); }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtp(req.body.email, req.body.otp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getMe(req: Request, res: Response) {
    const user = (req as any).user;
    const shop = (req as any).shop;
    res.json(authService.formatUser(user, shop));
  },
};
