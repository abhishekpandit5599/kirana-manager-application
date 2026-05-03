import { Router, type IRouter } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { CreateCustomerBody, UpdateCustomerBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/customers", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const { search } = req.query as { search?: string };

  let customers = await db.select().from(customersTable).where(eq(customersTable.shopId, shop.id));

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  res.json(customers.map(formatCustomer));
});

router.post("/customers", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, phone, email, address, notes } = parsed.data;
  const [customer] = await db.insert(customersTable).values({
    shopId: shop.id,
    name,
    phone: phone ?? null,
    email: email ?? null,
    address: address ?? null,
    notes: notes ?? null,
  }).returning();
  res.status(201).json(formatCustomer(customer));
});

router.get("/customers/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [customer] = await db.select().from(customersTable).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shop.id)));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(formatCustomer(customer));
});

router.patch("/customers/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updateData.name = d.name;
  if (d.phone !== undefined) updateData.phone = d.phone;
  if (d.email !== undefined) updateData.email = d.email;
  if (d.address !== undefined) updateData.address = d.address;
  if (d.notes !== undefined) updateData.notes = d.notes;

  const [customer] = await db.update(customersTable).set(updateData as any).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shop.id))).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(formatCustomer(customer));
});

router.delete("/customers/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [customer] = await db.delete(customersTable).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shop.id))).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
