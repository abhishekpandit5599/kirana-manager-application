import { db, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export const notificationRepository = {
  async findAllByShop(shopId: string, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }) {
    return db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.shopId, shopId))
      .orderBy(sql`${notificationsTable.createdAt} DESC`)
      .limit(pagination.limit)
      .offset(pagination.offset);
  },
  async create(data: any) {
    const [n] = await db.insert(notificationsTable).values(data).returning();
    return n;
  },
  async markRead(id: string, shopId: string) {
    const [n] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, id), eq(notificationsTable.shopId, shopId))).returning();
    return n ?? null;
  },
  async markAllReadByShop(shopId: string) {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.shopId, shopId), eq(notificationsTable.isRead, false)));
  },
  async countUnread(shopId: string) {
    const unread = await db.select().from(notificationsTable).where(and(eq(notificationsTable.shopId, shopId), eq(notificationsTable.isRead, false)));
    return unread.length;
  },
};
