import { db, itemsTable, defaultItemsTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";

export const inventoryRepository = {
  async findAllByShop(shopId: string, filters: any = {}, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }) {
    const conditions = [eq(itemsTable.shopId, shopId)];

    if (filters.category && filters.category !== "all") {
      conditions.push(eq(itemsTable.category, filters.category));
    }
    if (filters.q) {
      const search = `%${filters.q}%`;
      const searchCols = [
        ilike(itemsTable.name, search),
        ilike(itemsTable.category, search)
      ].filter((c): c is any => c !== undefined);
      
      if (searchCols.length > 0) {
        conditions.push(or(...searchCols)!);
      }
    }

    let query = db.select()
      .from(itemsTable)
      .where(and(...conditions))
      .orderBy(desc(itemsTable.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return query;
  },

  async findById(id: string, shopId: string) {
    const [item] = await db.select().from(itemsTable).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shopId)));
    return item ?? null;
  },

  async findByName(name: string, shopId: string) {
    const [item] = await db.select().from(itemsTable).where(and(ilike(itemsTable.name, name), eq(itemsTable.shopId, shopId)));
    return item ?? null;
  },

  async create(data: any) {
    const [item] = await db.insert(itemsTable).values(data).returning();
    return item;
  },

  async bulkCreate(items: any[]) {
    if (items.length === 0) return [];
    return db.insert(itemsTable).values(items).returning();
  },

  async update(id: string, shopId: string, data: any) {
    const [item] = await db.update(itemsTable).set(data).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shopId))).returning();
    return item ?? null;
  },

  async deleteById(id: string, shopId: string) {
    const [item] = await db.delete(itemsTable).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shopId))).returning();
    return item ?? null;
  },

  async deleteAllByShop(shopId: string) {
    await db.delete(itemsTable).where(eq(itemsTable.shopId, shopId));
  },

  // Default items catalog
  async getAllDefaultItems(filters: any = {}, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }) {
    const conditions = [];

    if (filters.q) {
      const search = `%${filters.q}%`;
      const searchCols = [
        ilike(defaultItemsTable.name, search),
        ilike(defaultItemsTable.category, search)
      ].filter((c): c is any => c !== undefined);
      
      if (searchCols.length > 0) {
        conditions.push(or(...searchCols)!);
      }
    }

    return db.select()
      .from(defaultItemsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async seedDefaultItems(items: { name: string; category: string; price: string; unit: string }[]) {
    if (items.length === 0) return;
    await db.insert(defaultItemsTable).values(items).onConflictDoNothing();
  },

  async getUniqueCategories(shopId: string) {
    const results = await db.selectDistinct({ category: itemsTable.category })
      .from(itemsTable)
      .where(eq(itemsTable.shopId, shopId));
    return results.map(r => r.category).filter(Boolean);
  },

  async getDefaultCategories() {
    const results = await db.selectDistinct({ category: defaultItemsTable.category })
      .from(defaultItemsTable);
    return results.map(r => r.category).filter(Boolean);
  },
};
