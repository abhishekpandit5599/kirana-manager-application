import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/analytics/dashboard", authMiddleware, reportsController.dashboard);
router.get("/analytics/sales", authMiddleware, reportsController.salesAnalytics);
router.get("/analytics/top-items", authMiddleware, reportsController.topItems);
router.get("/reports/daily", authMiddleware, reportsController.dailyReport);

export default router;
