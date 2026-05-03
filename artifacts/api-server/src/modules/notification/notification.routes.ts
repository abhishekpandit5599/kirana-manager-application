import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/notifications", authMiddleware, notificationController.list);
router.post("/notifications", authMiddleware, notificationController.create);
router.patch("/notifications/:id/read", authMiddleware, notificationController.markRead);

export default router;
