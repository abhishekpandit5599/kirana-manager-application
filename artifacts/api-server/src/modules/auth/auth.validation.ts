import { z } from "zod/v4";

export const SendOtpBody = z.object({
  email: z.string().email("Invalid email address"),
});

export const VerifyOtpBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const RegisterBody = z.object({
  name: z.string().min(2).max(100),
  shopName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  otpToken: z.string().optional(), // verified OTP token ID
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordBody = z.object({
  email: z.string().email(),
});

export const ResetPasswordBody = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
