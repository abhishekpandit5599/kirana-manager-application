import { db, itemsTable, defaultItemsTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";

export const inventoryRepository = {
  async findAllByShop(shopId: string) {
    return db.select().from(itemsTable).where(eq(itemsTable.shopId, shopId));
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
  async getAllDefaultItems() {
    return db.select().from(defaultItemsTable);
  },

  async seedDefaultItems(items: { name: string; category: string; price: string; unit: string }[]) {
    if (items.length === 0) return;
    await db.insert(defaultItemsTable).values(items).onConflictDoNothing();
  },
};
