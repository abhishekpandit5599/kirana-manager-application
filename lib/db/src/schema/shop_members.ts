import { pgTable, text, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopMembersTable = pgTable("shop_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull().default("staff"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("unique_shop_member").on(table.shopId, table.userId),
]);

export const insertShopMemberSchema = createInsertSchema(shopMembersTable).omit({ id: true, joinedAt: true });
export type InsertShopMember = z.infer<typeof insertShopMemberSchema>;
export type ShopMember = typeof shopMembersTable.$inferSelect;
