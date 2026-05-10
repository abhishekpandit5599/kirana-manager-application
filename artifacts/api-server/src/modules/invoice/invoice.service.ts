import { invoiceRepository } from "./invoice.repository";
import { inventoryRepository } from "../inventory/inventory.repository";
import { notificationService } from "../notification/notification.service";
import { AppError } from "../../middlewares/error.middleware";
import { db, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendWhatsAppInvoice } from "../../utils/whatsapp";
import { generateInvoicePdf, type InvoiceForPdf } from "../../utils/pdf";
import ExcelJS from "exceljs";
import { sendWhatsAppTemplate } from "../../utils/whatsapp-cloud";
import { customerService } from "../customer/customer.service";
import { customerRepository } from "../customer/customer.repository";
import { settingsRepository } from "../settings/settings.repository";

function formatInvoice(invoice: any, pdfUrl?: string) {
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
    createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : new Date(invoice.createdAt).toISOString(),
  };
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  return `INV-${dateStr}-${rand}`;
}

export const invoiceService = {
  async listInvoices(shopId: string, filters: any, baseUrl: string) {
    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;

    // Default 1 month range if not provided
    if (!filters.startDate && !filters.endDate) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      filters.startDate = start.toISOString();
      filters.endDate = end.toISOString();
    }

    const invoices = await invoiceRepository.findAllByShop(shopId, filters, { limit: Math.min(limit, 100), offset });

    return invoices.map((inv) => formatInvoice(inv, `${baseUrl}/api/invoices/${inv.id}/pdf`));
  },

  async getInvoice(id: string, shopId: string, baseUrl: string) {
    const invoice = await invoiceRepository.findById(id, shopId);
    if (!invoice) throw new AppError(404, "Invoice not found");
    return formatInvoice(invoice, `${baseUrl}/api/invoices/${invoice.id}/pdf`);
  },

  async createInvoice(shopId: string, data: any, baseUrl: string, shopName: string) {
    const invoiceItems: any[] = [];
    let total = 0;

    for (const lineItem of data.items) {
      const dbItem = await inventoryRepository.findById(lineItem.itemId, shopId);
      if (!dbItem) throw new AppError(400, `Item with id ${lineItem.itemId} not found`);

      const price = parseFloat(dbItem.price);
      const itemTotal = price * lineItem.quantity;
      total += itemTotal;
      invoiceItems.push({
        itemId: dbItem.id, itemName: dbItem.name, quantity: lineItem.quantity,
        unit: dbItem.unit, price, total: itemTotal,
      });

      // Deduct stock
      const newStock = Math.max(0, parseFloat(dbItem.stock) - lineItem.quantity);
      await inventoryRepository.update(dbItem.id, shopId, { stock: newStock.toString() });

      // Check low stock → create notification
      if (newStock <= parseFloat(dbItem.lowStockThreshold)) {
        await notificationService.createLowStockNotification(shopId, dbItem.name, newStock, dbItem.unit);
      }
    }

    let finalCustomerId = data.customerId ?? null;

    if (data.customerPhone && !finalCustomerId) {
      const [existing] = await db.select().from(customersTable).where(and(eq(customersTable.phone, data.customerPhone), eq(customersTable.shopId, shopId)));
      if (existing) {
        finalCustomerId = existing.id;
      } else {
        const [newCustomer] = await db.insert(customersTable).values({
          shopId,
          name: data.customerName || "Unknown",
          phone: data.customerPhone,
        }).returning();
        finalCustomerId = newCustomer.id;
      }
    }

    const invoice = await invoiceRepository.create({
      invoiceNumber: generateInvoiceNumber(),
      shopId,
      customerName: data.customerName ?? null,
      customerPhone: data.customerPhone ?? null,
      customerId: finalCustomerId,
      items: invoiceItems,
      subtotal: total.toString(),
      total: total.toString(),
      paymentMethod: data.paymentMethod,
      status: data.status ?? "paid",
    });

    const pdfUrl = `${baseUrl}/api/invoices/public/pdf/${invoice.id}`;

    // Send WhatsApp invoice in background
    if (data.customerPhone) {
      // Normalize phone (add 91 if 10 digits, remove + if present)
      const normalizedPhone = data.customerPhone.startsWith("+")
        ? data.customerPhone.replace("+", "")
        : data.customerPhone.length === 10
        ? `91${data.customerPhone}`
        : data.customerPhone;

      const customer = await customerRepository.findByPhone(shopId, data.customerPhone);
      if(!customer){
        await customerService.createCustomer(shopId, {
          name: data.customerName ?? null,
          phone: data.customerPhone ?? null,
        }); 
      }
      sendWhatsAppTemplate({
        to: normalizedPhone,
        templateName: "invoice_sent",
        params: [
          shopName,
          data.customerName || "Customer",
          invoice.invoiceNumber,
          total.toString(),
          new Date(invoice.createdAt).toLocaleDateString("en-IN"),
          data.paymentMethod
        ],
        buttonParam: invoice.id
      }).catch((err) => {
        console.error("WhatsApp send failed:", err);
      });
    }

    return formatInvoice(invoice, pdfUrl);
  },

  async getInvoicePdf(id: string, shopId: string, shop: any): Promise<Buffer> {
    const invoice = await invoiceRepository.findById(id, shopId);
    if (!invoice) throw new AppError(404, "Invoice not found");

    return generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      shopName: shop.name,
      shopPhone: shop.phone,
      shopAddress: shop.address,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      items: (invoice.items as any[]).map((item: any) => ({
        itemName: item.itemName, 
        quantity: Math.round(parseFloat(item.quantity) * 1000) / 1000, 
        unit: item.unit,
        price: Math.round(parseFloat(item.price) * 100) / 100, 
        total: Math.round(parseFloat(item.total) * 100) / 100,
      })),
      subtotal: parseFloat(invoice.subtotal),
      total: parseFloat(invoice.total),
      paymentMethod: invoice.paymentMethod,
      createdAt: invoice.createdAt.toISOString(),
    });
  },

  async getPublicInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await invoiceRepository.findByIdGlobal(id);
    if (!invoice) throw new AppError(404, "Invoice not found");

    const shop = await settingsRepository.findById(invoice.shopId);
    if (!shop) throw new AppError(404, "Shop not found");

    return generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      shopName: shop.name,
      shopPhone: shop.phone,
      shopAddress: shop.address,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      items: (invoice.items as any[]).map((item: any) => ({
        itemName: item.itemName, 
        quantity: Math.round(parseFloat(item.quantity) * 1000) / 1000, 
        unit: item.unit,
        price: Math.round(parseFloat(item.price) * 100) / 100, 
        total: Math.round(parseFloat(item.total) * 100) / 100,
      })),
      subtotal: parseFloat(invoice.subtotal),
      total: parseFloat(invoice.total),
      paymentMethod: invoice.paymentMethod,
      createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : new Date(invoice.createdAt).toISOString(),
    });
  },

  async getInvoiceExcel(id: string, shopId: string) {
    const invoice = await invoiceRepository.findById(id, shopId);
    if (!invoice) throw new AppError(404, "Invoice not found");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Invoice");
    ws.columns = [
      { header: "Item", key: "itemName", width: 25 },
      { header: "Qty", key: "quantity", width: 10 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Price", key: "price", width: 12 },
      { header: "Total", key: "total", width: 12 },
    ];
    for (const item of invoice.items as any[]) {
      const q = parseFloat(item.quantity);
      const u = item.unit.toLowerCase();
      let displayQty: string | number = Math.round(q * 1000) / 1000;
      let displayUnit = item.unit;

      if (q < 1 && q > 0) {
        if (u === 'kg') {
          displayQty = Math.round(q * 1000);
          displayUnit = 'gm';
        } else if (u === 'litre' || u === 'ltr' || u === 'liter') {
          displayQty = Math.round(q * 1000);
          displayUnit = 'ml';
        }
      }

      ws.addRow({
        itemName: item.itemName,
        quantity: displayQty,
        unit: displayUnit,
        price: Math.round(parseFloat(item.price) * 100) / 100,
        total: Math.round(parseFloat(item.total) * 100) / 100
      });
    }
    ws.addRow({});
    ws.addRow({ itemName: "TOTAL", total: Math.round(parseFloat(invoice.total) * 100) / 100 });
    return wb;
  },
};
