import { db, shopSettingsTable, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const settingsRepository = {
  async findByShop(shopId: string) {
    const [settings] = await db.select().from(shopSettingsTable).where(eq(shopSettingsTable.shopId, shopId));
    return settings ?? null;
  },
  async upsert(shopId: string, data: any) {
    const existing = await this.findByShop(shopId);
    if (existing) {
      const [updated] = await db.update(shopSettingsTable).set(data).where(eq(shopSettingsTable.shopId, shopId)).returning();
      return updated;
    }
    const [created] = await db.insert(shopSettingsTable).values({ shopId, ...data }).returning();
    return created;
  },
  async updateShopName(shopId: string, name: string) {
    await db.update(shopsTable).set({ name }).where(eq(shopsTable.id, shopId));
  },
  async findById(id: string) {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, id));
    return shop;
  },
};
