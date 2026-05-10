import { db, usersTable, otpTokensTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const authRepository = {
  async findUserByEmail(email: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user ?? null;
  },

  async findUserById(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  },

  async createUser(data: { name: string; email: string; passwordHash: string; phone?: string | null; isVerified?: boolean }) {
    const [user] = await db.insert(usersTable).values(data).returning();
    return user;
  },

  async updateUser(id: string, data: Partial<{ name: string; passwordHash: string; phone: string | null }>) {
    const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    return user;
  },

  async updateUserVerification(id: string, isVerified: boolean) {
    await db.update(usersTable).set({ isVerified }).where(eq(usersTable.id, id));
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
  },

  // OTP
  async createOtp(email: string, otp: string, expiresAt: Date) {
    const [token] = await db.insert(otpTokensTable).values({ email, otp, expiresAt, verified: false }).returning();
    return token;
  },

  async findValidOtp(email: string, otp: string) {
    const tokens = await db.select().from(otpTokensTable)
      .where(and(eq(otpTokensTable.email, email), eq(otpTokensTable.otp, otp), eq(otpTokensTable.verified, false)));
    return tokens[0] ?? null;
  },

  async markOtpVerified(id: string) {
    await db.update(otpTokensTable).set({ verified: true }).where(eq(otpTokensTable.id, id));
  },

  async findVerifiedOtp(email: string) {
    const tokens = await db.select().from(otpTokensTable)
      .where(and(eq(otpTokensTable.email, email), eq(otpTokensTable.verified, true)));
    return tokens[0] ?? null;
  },

  // Password reset
  async createResetToken(userId: string, expiresAt: Date) {
    const token = randomUUID();
    const [record] = await db.insert(passwordResetTokensTable)
      .values({ userId, token, expiresAt, used: false })
      .returning();
    return record;
  },

  async findValidResetToken(token: string) {
    const [record] = await db.select().from(passwordResetTokensTable)
      .where(and(eq(passwordResetTokensTable.token, token), eq(passwordResetTokensTable.used, false)));
    return record ?? null;
  },

  async markResetTokenUsed(id: string) {
    await db.update(passwordResetTokensTable).set({ used: true }).where(eq(passwordResetTokensTable.id, id));
  },
};
