import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { sendSuccess } from "../../utils/response";
import { SUCCESS_MESSAGES } from "../../utils/messages";

export const authController = {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtp(req.body.email);
      sendSuccess(res, result, SUCCESS_MESSAGES.OTP_SENT);
    } catch (err) { next(err); }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtp(req.body.email, req.body.otp);
      sendSuccess(res, result, SUCCESS_MESSAGES.OTP_VERIFIED);
    } catch (err) { next(err); }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, SUCCESS_MESSAGES.REGISTRATION_SUCCESS, 201);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      sendSuccess(res, result, SUCCESS_MESSAGES.LOGIN);
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result, SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, result, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
    } catch (err) { next(err); }
  },

  async getMe(req: Request, res: Response) {
    const user = (req as any).user;
    const shop = (req as any).shop;
    const formatted = authService.formatUser(user, shop);
    sendSuccess(res, formatted, SUCCESS_MESSAGES.FETCHED("User profile"));
  },
};
