import { createHash, randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, usersTable, shopsTable, shopMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export function hashPassword(password: string): string {
  const salt = "kirana_salt_2024";
  return createHash("sha256").update(password + salt).digest("hex");
}

export function generateToken(userId: string, shopId: string): string {
  const payload = { userId, shopId, ts: Date.now(), rand: randomBytes(8).toString("hex") };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sig = createHash("sha256").update(data + "kirana_jwt_secret_2024").digest("hex");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { userId: string; shopId: string } | null {
  try {
    const [data, sig] = token.split(".");
    const expectedSig = createHash("sha256").update(data + "kirana_jwt_secret_2024").digest("hex");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    if (!payload.userId || !payload.shopId) return null;
    return { userId: payload.userId, shopId: payload.shopId };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, payload.shopId));
  if (!shop) {
    res.status(401).json({ error: "Shop not found" });
    return;
  }

  const [membership] = await db
    .select()
    .from(shopMembersTable)
    .where(and(eq(shopMembersTable.shopId, shop.id), eq(shopMembersTable.userId, user.id)));
  if (!membership) {
    res.status(403).json({ error: "Not a member of this shop" });
    return;
  }

  (req as any).user = user;
  (req as any).shop = shop;
  (req as any).membership = membership;
  next();
}

export function getUser(req: Request) {
  return (req as any).user as typeof usersTable.$inferSelect;
}

export function getShop(req: Request) {
  return (req as any).shop as typeof shopsTable.$inferSelect;
}
