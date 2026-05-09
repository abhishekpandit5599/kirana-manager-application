import { db, customersTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";

export const customerRepository = {
  async findAllByShop(shopId: string, filters: any = {}, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }) {
    const conditions = [eq(customersTable.shopId, shopId)];

    if (filters.q) {
      const search = `%${filters.q}%`;
      const searchCols = [
        ilike(customersTable.name, search),
        ilike(customersTable.phone, search),
        ilike(customersTable.email, search)
      ].filter((c): c is any => c !== undefined);
      
      if (searchCols.length > 0) {
        conditions.push(or(...searchCols)!);
      }
    }

    return db.select()
      .from(customersTable)
      .where(and(...conditions))
      .orderBy(desc(customersTable.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
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
