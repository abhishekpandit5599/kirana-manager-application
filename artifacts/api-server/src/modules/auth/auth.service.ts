import { db, shopsTable, shopMembersTable, shopSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authRepository } from "./auth.repository";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { generateOtp, getOtpExpiry, isOtpExpired } from "../../utils/otp";
import { sendOtpEmail, sendPasswordResetEmail } from "../../utils/email";
import { config } from "../../config";
import { AppError } from "../../middlewares/error.middleware";

export const authService = {
  async sendOtp(email: string) {
    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10);
    await authRepository.createOtp(email, otp, expiresAt);
    await sendOtpEmail(email, otp);
    return { message: "OTP sent to email" };
  },

  async verifyOtp(email: string, otp: string) {
    const record = await authRepository.findValidOtp(email, otp);
    if (!record) throw new AppError(400, "Invalid OTP", "OTP_INVALID");
    if (isOtpExpired(record.expiresAt)) throw new AppError(400, "OTP has expired", "OTP_EXPIRED");
    
    await authRepository.markOtpVerified(record.id);
    
    // Mark user as verified if they exist
    const user = await authRepository.findUserByEmail(email);
    if (user) {
      if (!user.isVerified) {
        await authRepository.updateUserVerification(user.id, true);
      }
      
      // Get shop info for token
      const [membership] = await db.select().from(shopMembersTable).where(eq(shopMembersTable.userId, user.id));
      if (membership) {
        const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, membership.shopId));
        if (shop) {
          const token = signToken(user.id, shop.id);
          return { 
            verified: true, 
            otpTokenId: record.id,
            token,
            user: authService.formatUser(user, shop)
          };
        }
      }
    }
    
    return { verified: true, otpTokenId: record.id };
  },

  async register(data: { name: string; shopName: string; email: string; password: string; phone?: string }) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing && existing.isVerified) {
      throw new AppError(400, "Email already registered", "CONFLICT");
    }

    const passwordHash = await hashPassword(data.password);
    let user;
    
    if (existing) {
      // Update existing unverified user
      user = await authRepository.updateUser(existing.id, {
        name: data.name,
        passwordHash,
        phone: data.phone ?? null,
      });
      // Ensure shop exists or update it?
      // For simplicity, we'll assume they need to complete registration
    } else {
      user = await authRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone ?? null,
        isVerified: false,
      });

      const [shop] = await db.insert(shopsTable).values({
        name: data.shopName,
        ownerUserId: user.id,
      }).returning();

      await db.insert(shopMembersTable).values({
        shopId: shop.id,
        userId: user.id,
        role: "owner",
      });

      await db.insert(shopSettingsTable).values({ shopId: shop.id }).onConflictDoNothing();
    }

    // Send OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10);
    await authRepository.createOtp(data.email, otp, expiresAt);
    await sendOtpEmail(data.email, otp);

    return {
      message: "OTP sent to email. Please verify to complete registration.",
      email: data.email
    };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new AppError(401, "Invalid email or password");

    if (!user.isVerified) {
      throw new AppError(401, "Please verify your email first", "UNVERIFIED");
    }

    const valid = await comparePassword(password, user.passwordHash);
    // Also check legacy sha256 hash for backward compat
    if (!valid) {
      const { createHash } = require("crypto");
      const legacyHash = createHash("sha256").update(password + "kirana_salt_2024").digest("hex");
      if (user.passwordHash !== legacyHash) {
        throw new AppError(401, "Invalid email or password");
      }
      // Upgrade to bcrypt on successful legacy login
      const newHash = await hashPassword(password);
      await authRepository.updateUserPassword(user.id, newHash);
    }

    const [membership] = await db.select().from(shopMembersTable).where(eq(shopMembersTable.userId, user.id));
    if (!membership) throw new AppError(400, "No shop associated with this account");

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, membership.shopId));
    if (!shop) throw new AppError(400, "Shop not found");

    const token = signToken(user.id, shop.id);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        shopName: shop.name,
        shopId: shop.id,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
      },
    };
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: "If this email is registered, a reset link has been sent" };
    }
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const record = await authRepository.createResetToken(user.id, expiresAt);
    const resetUrl = `${config.appUrl}/reset-password?token=${record.token}`;
    await sendPasswordResetEmail(email, resetUrl);
    return { message: "If this email is registered, a reset link has been sent" };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await authRepository.findValidResetToken(token);
    if (!record) throw new AppError(400, "Invalid or expired reset token", "TOKEN_INVALID");
    if (new Date() > record.expiresAt) throw new AppError(400, "Reset token has expired", "TOKEN_EXPIRED");

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUserPassword(record.userId, passwordHash);
    await authRepository.markResetTokenUsed(record.id);
    return { message: "Password reset successfully" };
  },

  formatUser(user: any, shop: any) {
    return {
      id: user.id,
      name: user.name,
      shopName: shop.name,
      shopId: shop.id,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    };
  },
};
