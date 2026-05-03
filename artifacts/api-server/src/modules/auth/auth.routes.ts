import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { SendOtpBody, VerifyOtpBody, RegisterBody, LoginBody, ForgotPasswordBody, ResetPasswordBody } from "./auth.validation";

const router = Router();

router.post("/auth/send-otp", validate(SendOtpBody), authController.sendOtp);
router.post("/auth/verify-otp", validate(VerifyOtpBody), authController.verifyOtp);
router.post("/auth/register", validate(RegisterBody), authController.register);
router.post("/auth/login", validate(LoginBody), authController.login);
router.post("/auth/forgot-password", validate(ForgotPasswordBody), authController.forgotPassword);
router.post("/auth/reset-password", validate(ResetPasswordBody), authController.resetPassword);
router.get("/auth/me", authMiddleware, authController.getMe);

export default router;
