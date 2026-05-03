import { pgTable, text, uuid, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labourTable = pgTable("labour", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role"),
  salaryPerMonth: numeric("salary_per_month", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLabourSchema = createInsertSchema(labourTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabour = z.infer<typeof insertLabourSchema>;
export type Labour = typeof labourTable.$inferSelect;
