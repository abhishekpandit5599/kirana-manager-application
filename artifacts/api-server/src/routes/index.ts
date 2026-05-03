import { Router, type IRouter } from "express";

// Module routes
import authRoutes from "../modules/auth/auth.routes";
import inventoryRoutes from "../modules/inventory/inventory.routes";
import invoiceRoutes from "../modules/invoice/invoice.routes";
import customerRoutes from "../modules/customer/customer.routes";
import labourRoutes from "../modules/labour/labour.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import reportsRoutes from "../modules/reports/reports.routes";
import aiRoutes from "../modules/ai/ai.routes";

// Legacy routes (health)
import healthRouter from "./health";

const router: IRouter = Router();

// Health check
router.use(healthRouter);

// Module routes
router.use(authRoutes);
router.use(inventoryRoutes);
router.use(invoiceRoutes);
router.use(customerRoutes);
router.use(labourRoutes);
router.use(notificationRoutes);
router.use(settingsRoutes);
router.use(reportsRoutes);
router.use(aiRoutes);

export default router;
