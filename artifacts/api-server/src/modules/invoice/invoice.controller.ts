import { Request, Response, NextFunction } from "express";
import { invoiceService } from "./invoice.service";
import { getShop } from "../../middlewares/auth.middleware";

function getBaseUrl(req: Request): string {
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${proto}://${host}`;
}

export const invoiceController = {
  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await invoiceService.listInvoices(shop.id, req.query, getBaseUrl(req));
      res.json(result);
    } catch (err) { next(err); }
  },

  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await invoiceService.getInvoice(req.params.id, shop.id, getBaseUrl(req));
      res.json(result);
    } catch (err) { next(err); }
  },

  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const result = await invoiceService.createInvoice(shop.id, req.body, getBaseUrl(req), shop.name);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async getInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const pdfBuffer = await invoiceService.getInvoicePdf(req.params.id, shop.id, shop);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (err) { next(err); }
  },

  async getPublicInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await invoiceService.getPublicInvoicePdf(req.params.id);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (err) { next(err); }
  },

  async getInvoiceExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = getShop(req);
      const wb = await invoiceService.getInvoiceExcel(req.params.id, shop.id);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="invoice.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  },
};
