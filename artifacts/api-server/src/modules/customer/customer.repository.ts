import { db, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const customerRepository = {
  async findAllByShop(shopId: string) {
    return db.select().from(customersTable).where(eq(customersTable.shopId, shopId));
  },
  async findByPhone(shopId: string,phone:string) {
    const [c] = await db.select().from(customersTable).where(and(eq(customersTable.shopId, shopId),eq(customersTable.phone, phone))).limit(1);
    return c ?? null;
  },
  async findById(id: string, shopId: string) {
    const [c] = await db.select().from(customersTable).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)));
    return c ?? null;
  },
  async create(data: any) {
    const [c] = await db.insert(customersTable).values(data).returning();
    return c;
  },
  async update(id: string, shopId: string, data: any) {
    const [c] = await db.update(customersTable).set(data).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId))).returning();
    return c ?? null;
  },
  async deleteById(id: string, shopId: string) {
    const [c] = await db.delete(customersTable).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId))).returning();
    return c ?? null;
  },
};
