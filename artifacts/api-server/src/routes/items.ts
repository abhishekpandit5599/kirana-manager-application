import { Router, type IRouter } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { CreateItemBody, UpdateItemBody } from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_KIRANA_ITEMS = [
  { name: "Basmati Rice", category: "Grains", price: "80", stock: "50", unit: "kg", lowStockThreshold: "10" },
  { name: "Atta (Wheat Flour)", category: "Grains", price: "40", stock: "30", unit: "kg", lowStockThreshold: "5" },
  { name: "Dal Chana", category: "Pulses", price: "90", stock: "20", unit: "kg", lowStockThreshold: "3" },
  { name: "Dal Moong", category: "Pulses", price: "110", stock: "15", unit: "kg", lowStockThreshold: "3" },
  { name: "Dal Toor", category: "Pulses", price: "100", stock: "18", unit: "kg", lowStockThreshold: "3" },
  { name: "Mustard Oil", category: "Oils", price: "130", stock: "25", unit: "litre", lowStockThreshold: "5" },
  { name: "Refined Oil", category: "Oils", price: "120", stock: "20", unit: "litre", lowStockThreshold: "5" },
  { name: "Sugar", category: "Sweeteners", price: "45", stock: "40", unit: "kg", lowStockThreshold: "10" },
  { name: "Salt", category: "Spices", price: "20", stock: "30", unit: "kg", lowStockThreshold: "5" },
  { name: "Red Chili Powder", category: "Spices", price: "200", stock: "5", unit: "kg", lowStockThreshold: "2" },
  { name: "Turmeric Powder", category: "Spices", price: "150", stock: "4", unit: "kg", lowStockThreshold: "1" },
  { name: "Coriander Powder", category: "Spices", price: "120", stock: "5", unit: "kg", lowStockThreshold: "1" },
  { name: "Garam Masala", category: "Spices", price: "250", stock: "3", unit: "kg", lowStockThreshold: "0.5" },
  { name: "Tea Leaves (Chai)", category: "Beverages", price: "400", stock: "5", unit: "kg", lowStockThreshold: "1" },
  { name: "Milk", category: "Dairy", price: "60", stock: "10", unit: "litre", lowStockThreshold: "5" },
  { name: "Ghee", category: "Dairy", price: "500", stock: "10", unit: "kg", lowStockThreshold: "2" },
  { name: "Biscuits (Parle-G)", category: "Snacks", price: "5", stock: "200", unit: "pcs", lowStockThreshold: "20" },
  { name: "Namkeen", category: "Snacks", price: "20", stock: "50", unit: "pcs", lowStockThreshold: "10" },
  { name: "Soap (Lifebuoy)", category: "Hygiene", price: "30", stock: "30", unit: "pcs", lowStockThreshold: "10" },
  { name: "Detergent Powder", category: "Cleaning", price: "80", stock: "20", unit: "kg", lowStockThreshold: "5" },
  { name: "Matchbox", category: "Miscellaneous", price: "2", stock: "100", unit: "pcs", lowStockThreshold: "20" },
  { name: "Candles", category: "Miscellaneous", price: "15", stock: "40", unit: "pcs", lowStockThreshold: "10" },
  { name: "Bread", category: "Bakery", price: "40", stock: "10", unit: "pcs", lowStockThreshold: "5" },
  { name: "Eggs", category: "Dairy", price: "8", stock: "60", unit: "pcs", lowStockThreshold: "12" },
  { name: "Onion", category: "Vegetables", price: "30", stock: "20", unit: "kg", lowStockThreshold: "5" },
  { name: "Potato", category: "Vegetables", price: "25", stock: "25", unit: "kg", lowStockThreshold: "5" },
  { name: "Tomato", category: "Vegetables", price: "40", stock: "10", unit: "kg", lowStockThreshold: "3" },
  { name: "Garlic", category: "Spices", price: "100", stock: "5", unit: "kg", lowStockThreshold: "1" },
  { name: "Ginger", category: "Spices", price: "80", stock: "3", unit: "kg", lowStockThreshold: "1" },
  { name: "Coconut Oil", category: "Oils", price: "180", stock: "10", unit: "litre", lowStockThreshold: "2" },
];

function formatItem(item: typeof itemsTable.$inferSelect) {
  const stock = parseFloat(item.stock);
  const threshold = parseFloat(item.lowStockThreshold);
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: parseFloat(item.price),
    stock,
    unit: item.unit,
    lowStockThreshold: threshold,
    isLowStock: stock <= threshold,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/items", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const { category, lowStock } = req.query as { category?: string; lowStock?: string };

  let items = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shop.id));

  if (category) {
    items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  }

  const formatted = items.map(formatItem);

  if (lowStock === "true") {
    res.json(formatted.filter((i) => i.isLowStock));
    return;
  }

  res.json(formatted);
});

router.post("/items", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, category, price, stock, unit, lowStockThreshold } = parsed.data;
  const [item] = await db.insert(itemsTable).values({
    name,
    category,
    price: price.toString(),
    stock: stock.toString(),
    unit,
    lowStockThreshold: (lowStockThreshold ?? 5).toString(),
    shopId: shop.id,
  }).returning();
  res.status(201).json(formatItem(item));
});

router.get("/items/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [item] = await db.select().from(itemsTable).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shop.id)));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(formatItem(item));
});

router.patch("/items/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updateData.name = d.name;
  if (d.category !== undefined) updateData.category = d.category;
  if (d.price !== undefined) updateData.price = d.price.toString();
  if (d.stock !== undefined) updateData.stock = d.stock.toString();
  if (d.unit !== undefined) updateData.unit = d.unit;
  if (d.lowStockThreshold !== undefined) updateData.lowStockThreshold = d.lowStockThreshold.toString();

  const [item] = await db.update(itemsTable).set(updateData as any).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shop.id))).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(formatItem(item));
});

router.delete("/items/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [item] = await db.delete(itemsTable).where(and(eq(itemsTable.id, id), eq(itemsTable.shopId, shop.id))).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/items/seed-defaults", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const existing = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shop.id));
  if (existing.length > 0) {
    res.json({ seeded: 0, message: "Items already exist. Delete existing items before seeding." });
    return;
  }
  const toInsert = DEFAULT_KIRANA_ITEMS.map((item) => ({
    ...item,
    shopId: shop.id,
  }));
  await db.insert(itemsTable).values(toInsert);
  res.json({ seeded: toInsert.length, message: `${toInsert.length} default kirana items added` });
});

export default router;
