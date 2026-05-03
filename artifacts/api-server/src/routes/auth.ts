import { Router, type IRouter } from "express";
import { db, usersTable, shopsTable, shopMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken, authMiddleware, getUser, getShop } from "../lib/auth";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUserResponse(user: typeof usersTable.$inferSelect, shop: typeof shopsTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    shopName: shop.name,
    shopId: shop.id,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, shopName, email, password, phone } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    phone: phone ?? null,
  }).returning();

  const [shop] = await db.insert(shopsTable).values({
    name: shopName,
    ownerUserId: user.id,
  }).returning();

  await db.insert(shopMembersTable).values({
    shopId: shop.id,
    userId: user.id,
    role: "owner",
  });

  const token = generateToken(user.id, shop.id);
  res.status(201).json({ token, user: formatUserResponse(user, shop) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const [membership] = await db.select().from(shopMembersTable).where(eq(shopMembersTable.userId, user.id));
  if (!membership) {
    res.status(400).json({ error: "No shop associated with this account" });
    return;
  }
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, membership.shopId));
  if (!shop) {
    res.status(400).json({ error: "Shop not found" });
    return;
  }

  const token = generateToken(user.id, shop.id);
  res.json({ token, user: formatUserResponse(user, shop) });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const user = getUser(req);
  const shop = getShop(req);
  res.json(formatUserResponse(user, shop));
});

export default router;
