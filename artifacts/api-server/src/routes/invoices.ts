import { Router, type IRouter } from "express";
import { db, invoicesTable, itemsTable, shopsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { CreateInvoiceBody, ListInvoicesQueryParams } from "@workspace/api-zod";
import { generateInvoicePdf, sendWhatsAppInvoice } from "../lib/pdf";

const router: IRouter = Router();

function formatInvoice(invoice: typeof invoicesTable.$inferSelect, pdfUrl?: string) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    customerId: invoice.customerId,
    items: invoice.items as any[],
    subtotal: parseFloat(invoice.subtotal),
    total: parseFloat(invoice.total),
    paymentMethod: invoice.paymentMethod,
    status: invoice.status,
    pdfUrl: pdfUrl ?? null,
    createdAt: invoice.createdAt.toISOString(),
  };
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  return `INV-${dateStr}-${rand}`;
}

function getBaseUrl(req: any): string {
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${proto}://${host}`;
}

router.get("/invoices", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = ListInvoicesQueryParams.safeParse(req.query);

  let invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shop.id)).orderBy(sql`${invoicesTable.createdAt} DESC`);

  if (parsed.success && parsed.data.startDate) {
    invoices = invoices.filter((i) => i.createdAt >= new Date(parsed.data.startDate!));
  }
  if (parsed.success && parsed.data.endDate) {
    invoices = invoices.filter((i) => i.createdAt <= new Date(parsed.data.endDate!));
  }

  const base = getBaseUrl(req);
  res.json(invoices.map((inv) => formatInvoice(inv, `${base}/api/invoices/${inv.id}/pdf`)));
});

router.post("/invoices", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customerName, customerPhone, customerId, items, paymentMethod, status } = parsed.data;

  const invoiceItems: any[] = [];
  let total = 0;

  for (const lineItem of items) {
    const [dbItem] = await db.select().from(itemsTable).where(and(eq(itemsTable.id, lineItem.itemId), eq(itemsTable.shopId, shop.id)));
    if (!dbItem) {
      res.status(400).json({ error: `Item with id ${lineItem.itemId} not found` });
      return;
    }
    const price = parseFloat(dbItem.price);
    const itemTotal = price * lineItem.quantity;
    total += itemTotal;
    invoiceItems.push({
      itemId: dbItem.id,
      itemName: dbItem.name,
      quantity: lineItem.quantity,
      unit: dbItem.unit,
      price,
      total: itemTotal,
    });
    const newStock = Math.max(0, parseFloat(dbItem.stock) - lineItem.quantity);
    await db.update(itemsTable).set({ stock: newStock.toString() }).where(eq(itemsTable.id, dbItem.id));
  }

  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber: generateInvoiceNumber(),
    shopId: shop.id,
    customerName: customerName ?? null,
    customerPhone: customerPhone ?? null,
    customerId: customerId ?? null,
    items: invoiceItems,
    subtotal: total.toString(),
    total: total.toString(),
    paymentMethod,
    status: status ?? "paid",
  }).returning();

  const base = getBaseUrl(req);
  const pdfUrl = `${base}/api/invoices/${invoice.id}/pdf`;

  if (customerPhone) {
    sendWhatsAppInvoice(customerPhone, pdfUrl, invoice.invoiceNumber, total, shop.name).catch(() => {});
  }

  res.status(201).json(formatInvoice(invoice, pdfUrl));
});

router.get("/invoices/:id", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.shopId, shop.id)));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const base = getBaseUrl(req);
  res.json(formatInvoice(invoice, `${base}/api/invoices/${invoice.id}/pdf`));
});

router.get("/invoices/:id/pdf", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const id = req.params.id;
  const [invoice] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.shopId, shop.id)));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    shopName: shop.name,
    shopPhone: shop.phone,
    shopAddress: shop.address,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    items: (invoice.items as any[]).map((item: any) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      total: item.total,
    })),
    subtotal: parseFloat(invoice.subtotal),
    total: parseFloat(invoice.total),
    paymentMethod: invoice.paymentMethod,
    createdAt: invoice.createdAt.toISOString(),
  });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    "Content-Length": pdfBuffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  });
  res.end(pdfBuffer);
});

export default router;
