import { db, invoicesTable } from "@workspace/db";
import { eq, and, sql, gte, lte, ilike, or, desc } from "drizzle-orm";

export const invoiceRepository = {
  async findAllByShop(shopId: string, filters: any = {}, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }) {
    const conditions = [eq(invoicesTable.shopId, shopId)];

    if (filters.startDate) {
      conditions.push(gte(invoicesTable.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      conditions.push(lte(invoicesTable.createdAt, new Date(filters.endDate)));
    }
    if (filters.paymentMethod) {
      conditions.push(eq(invoicesTable.paymentMethod, filters.paymentMethod));
    }
    if (filters.minAmount) {
      conditions.push(gte(invoicesTable.total, filters.minAmount.toString()));
    }
    if (filters.maxAmount) {
      conditions.push(lte(invoicesTable.total, filters.maxAmount.toString()));
    }
    if (filters.customerId) {
      conditions.push(eq(invoicesTable.customerId, filters.customerId));
    }
    if (filters.q) {
      const search = `%${filters.q}%`;
      const searchCols = [
        ilike(invoicesTable.invoiceNumber, search),
        ilike(invoicesTable.customerName, search),
        ilike(invoicesTable.customerPhone, search)
      ].filter((c): c is any => c !== undefined);
      
      if (searchCols.length > 0) {
        conditions.push(or(...searchCols)!);
      }
    }

    return db.select()
      .from(invoicesTable)
      .where(and(...conditions))
      .orderBy(desc(invoicesTable.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
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
    return db.select().from(invoicesTable).where(and(eq(invoicesTable.customerId, customerId), eq(invoicesTable.shopId, shopId))).orderBy(desc(invoicesTable.createdAt));
  },
};
