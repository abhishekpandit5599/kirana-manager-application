import { db, invoicesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export const invoiceRepository = {
  async findAllByShop(shopId: string) {
    return db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shopId)).orderBy(sql`${invoicesTable.createdAt} DESC`);
  },

  async findById(id: string, shopId: string) {
    const [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.shopId, shopId)));
    return invoice ?? null;
  },

  async findByIdGlobal(id: string) {
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    return invoice ?? null;
  },

  async create(data: any) {
    const [invoice] = await db.insert(invoicesTable).values(data).returning();
    return invoice;
  },

  async findByCustomer(customerId: string, shopId: string) {
    return db.select().from(invoicesTable).where(and(eq(invoicesTable.customerId, customerId), eq(invoicesTable.shopId, shopId))).orderBy(sql`${invoicesTable.createdAt} DESC`);
  },
};
