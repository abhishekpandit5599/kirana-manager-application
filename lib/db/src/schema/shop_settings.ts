import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopSettingsTable = pgTable("shop_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull().unique(),
  logoUrl: text("logo_url"),
  themeColor: text("theme_color").default("#1e40af"),
  upiId: text("upi_id"),
  upiQrUrl: text("upi_qr_url"),
  language: text("language").default("en"),
  ownerWhatsapp: text("owner_whatsapp"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShopSettingsSchema = createInsertSchema(shopSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShopSettings = z.infer<typeof insertShopSettingsSchema>;
export type ShopSettings = typeof shopSettingsTable.$inferSelect;
