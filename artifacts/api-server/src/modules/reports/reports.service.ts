import { db, invoicesTable, itemsTable, labourTable, notificationsTable, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const reportsService = {
  async getDashboard(shopId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shopId));
    const todayInvoices = allInvoices.filter((i) => i.createdAt >= todayStart);
    const monthInvoices = allInvoices.filter((i) => i.createdAt >= monthStart);

    const todaySales = todayInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
    const monthlySales = monthInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);

    const items = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shopId));
    const lowStockItems = items.filter((i) => parseFloat(i.stock) <= parseFloat(i.lowStockThreshold));
    const labour = await db.select().from(labourTable).where(and(eq(labourTable.shopId, shopId), eq(labourTable.isActive, true)));
    const unreadNotifications = await db.select().from(notificationsTable).where(and(eq(notificationsTable.shopId, shopId), eq(notificationsTable.isRead, false)));
    const customers = await db.select().from(customersTable).where(eq(customersTable.shopId, shopId));

    return {
      todaySales: Math.round(todaySales * 100) / 100,
      todayInvoices: todayInvoices.length,
      monthlySales: Math.round(monthlySales * 100) / 100,
      monthlyInvoices: monthInvoices.length,
      totalItems: items.length,
      lowStockCount: lowStockItems.length,
      totalLabour: labour.length,
      estimatedProfit: Math.round(monthlySales * 0.15 * 100) / 100,
      unreadNotifications: unreadNotifications.length,
      totalCustomers: customers.length,
    };
  },

  async getSalesAnalytics(shopId: string, period: string = "daily") {
    const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shopId));
    const dataMap: Record<string, { sales: number; invoices: number }> = {};
    const now = new Date();
    let days = period === "weekly" ? 84 : period === "monthly" ? 365 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now); date.setDate(date.getDate() - i);
      let key: string;
      if (period === "monthly") key = date.toISOString().slice(0, 7);
      else if (period === "weekly") { const ws = new Date(date); ws.setDate(date.getDate() - date.getDay()); key = ws.toISOString().slice(0, 10); }
      else key = date.toISOString().slice(0, 10);
      if (!dataMap[key]) dataMap[key] = { sales: 0, invoices: 0 };
    }

    for (const invoice of allInvoices) {
      let key: string;
      if (period === "monthly") key = invoice.createdAt.toISOString().slice(0, 7);
      else if (period === "weekly") { const ws = new Date(invoice.createdAt); ws.setDate(invoice.createdAt.getDate() - invoice.createdAt.getDay()); key = ws.toISOString().slice(0, 10); }
      else key = invoice.createdAt.toISOString().slice(0, 10);
      if (dataMap[key] !== undefined) { dataMap[key].sales += parseFloat(invoice.total); dataMap[key].invoices++; }
    }

    return Object.entries(dataMap).map(([date, d]) => ({ date, sales: Math.round(d.sales * 100) / 100, invoices: d.invoices }));
  },

  async getTopItems(shopId: string) {
    const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shopId));
    const itemTotals: Record<string, { itemId: string; itemName: string; totalQuantitySold: number; totalRevenue: number }> = {};
    for (const invoice of allInvoices) {
      for (const item of invoice.items as any[]) {
        if (!itemTotals[item.itemId]) itemTotals[item.itemId] = { itemId: item.itemId, itemName: item.itemName, totalQuantitySold: 0, totalRevenue: 0 };
        itemTotals[item.itemId].totalQuantitySold += item.quantity;
        itemTotals[item.itemId].totalRevenue += item.total;
      }
    }
    return Object.values(itemTotals).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
  },

  async getDailyReport(shopId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const allInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.shopId, shopId));
    const dayInvoices = allInvoices.filter((i) => i.createdAt >= dayStart && i.createdAt < dayEnd);
    const totalSales = dayInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
    const profit = totalSales * 0.15;

    const items = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shopId));
    const lowStockItems = items.filter((i) => parseFloat(i.stock) <= parseFloat(i.lowStockThreshold))
      .map((i) => ({ name: i.name, stock: parseFloat(i.stock), unit: i.unit }));

    const topItems = await this.getTopItems(shopId);

    return {
      date: dayStart.toISOString().slice(0, 10),
      totalSales: Math.round(totalSales * 100) / 100,
      estimatedProfit: Math.round(profit * 100) / 100,
      invoiceCount: dayInvoices.length,
      topItems: topItems.slice(0, 5),
      lowStockItems,
    };
  },
};
