import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { CreateNotificationBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.shopId, shop.id))
    .orderBy(sql`${notificationsTable.createdAt} DESC`);
  res.json(notifications.map(formatNotification));
});

router.post("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notification] = await db.insert(notificationsTable).values({
    type: parsed.data.type,
    title: parsed.data.title,
    message: parsed.data.message,
    shopId: shop.id,
  }).returning();
  res.status(201).json(formatNotification(notification));
});

router.patch("/notifications/:id/read", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.shopId, shop.id)))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(formatNotification(notification));
});

export default router;
