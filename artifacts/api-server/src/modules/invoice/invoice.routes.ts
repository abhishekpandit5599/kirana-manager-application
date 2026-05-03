import { Router } from "express";
import { invoiceController } from "./invoice.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { CreateInvoiceBody, ListInvoicesQuery } from "./invoice.validation";

const router = Router();

// router.get("/invoices", authMiddleware, validate(ListInvoicesQuery, "query"), invoiceController.listInvoices);
router.get("/invoices", authMiddleware, invoiceController.listInvoices);
router.post("/invoices", authMiddleware, validate(CreateInvoiceBody), invoiceController.createInvoice);
router.get("/invoices/:id", authMiddleware, invoiceController.getInvoice);
router.get("/invoices/:id/pdf", authMiddleware, invoiceController.getInvoicePdf);
router.get("/invoices/:id/excel", authMiddleware, invoiceController.getInvoiceExcel);

// Public route for WhatsApp PDF link
router.get("/invoices/public/:id/pdf", invoiceController.getPublicInvoicePdf);

export default router;
