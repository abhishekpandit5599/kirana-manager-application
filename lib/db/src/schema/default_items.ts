import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const defaultItemsTable = pgTable("default_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("kg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDefaultItemSchema = createInsertSchema(defaultItemsTable).omit({ id: true, createdAt: true });
export type InsertDefaultItem = z.infer<typeof insertDefaultItemSchema>;
export type DefaultItem = typeof defaultItemsTable.$inferSelect;
