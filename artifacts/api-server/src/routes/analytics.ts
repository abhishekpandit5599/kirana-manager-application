import { Router, type IRouter } from "express";
import { db, invoicesTable, itemsTable, labourTable, notificationsTable, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";

const router: IRouter = Router();

router.get("/analytics/dashboard", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shop.id));
  const todayInvoices = allInvoices.filter((i) => i.createdAt >= todayStart);
  const monthInvoices = allInvoices.filter((i) => i.createdAt >= monthStart);

  const todaySales = todayInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
  const monthlySales = monthInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);

  const items = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shop.id));
  const lowStockItems = items.filter((i) => parseFloat(i.stock) <= parseFloat(i.lowStockThreshold));

  const labour = await db.select().from(labourTable).where(and(eq(labourTable.shopId, shop.id), eq(labourTable.isActive, true)));

  const unreadNotifications = await db.select().from(notificationsTable).where(and(eq(notificationsTable.shopId, shop.id), eq(notificationsTable.isRead, false)));

  const customers = await db.select().from(customersTable).where(eq(customersTable.shopId, shop.id));

  const estimatedProfit = monthlySales * 0.15;

  res.json({
    todaySales: Math.round(todaySales * 100) / 100,
    todayInvoices: todayInvoices.length,
    monthlySales: Math.round(monthlySales * 100) / 100,
    monthlyInvoices: monthInvoices.length,
    totalItems: items.length,
    lowStockCount: lowStockItems.length,
    totalLabour: labour.length,
    estimatedProfit: Math.round(estimatedProfit * 100) / 100,
    unreadNotifications: unreadNotifications.length,
    totalCustomers: customers.length,
  });
});

router.get("/analytics/sales", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const period = (req.query.period as string) || "daily";

  const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shop.id));

  const dataMap: Record<string, { sales: number; invoices: number }> = {};

  const now = new Date();
  let days = 30;
  if (period === "weekly") days = 84;
  if (period === "monthly") days = 365;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    let key: string;
    if (period === "monthly") {
      key = date.toISOString().slice(0, 7);
    } else if (period === "weekly") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 10);
    }
    if (!dataMap[key]) dataMap[key] = { sales: 0, invoices: 0 };
  }

  for (const invoice of allInvoices) {
    let key: string;
    if (period === "monthly") {
      key = invoice.createdAt.toISOString().slice(0, 7);
    } else if (period === "weekly") {
      const weekStart = new Date(invoice.createdAt);
      weekStart.setDate(invoice.createdAt.getDate() - invoice.createdAt.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = invoice.createdAt.toISOString().slice(0, 10);
    }
    if (dataMap[key] !== undefined) {
      dataMap[key].sales += parseFloat(invoice.total);
      dataMap[key].invoices++;
    }
  }

  const result = Object.entries(dataMap).map(([date, d]) => ({
    date,
    sales: Math.round(d.sales * 100) / 100,
    invoices: d.invoices,
  }));

  res.json(result);
});

router.get("/analytics/top-items", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shop.id));

  const itemTotals: Record<string, { itemId: string; itemName: string; totalQuantitySold: number; totalRevenue: number }> = {};

  for (const invoice of allInvoices) {
    const items = invoice.items as any[];
    for (const item of items) {
      if (!itemTotals[item.itemId]) {
        itemTotals[item.itemId] = { itemId: item.itemId, itemName: item.itemName, totalQuantitySold: 0, totalRevenue: 0 };
      }
      itemTotals[item.itemId].totalQuantitySold += item.quantity;
      itemTotals[item.itemId].totalRevenue += item.total;
    }
  }

  const result = Object.values(itemTotals)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  res.json(result);
});

export default router;
