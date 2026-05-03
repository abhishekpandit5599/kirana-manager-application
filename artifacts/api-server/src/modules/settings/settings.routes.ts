import { Router } from "express";
import multer from "multer";
import path from "path";
import { settingsController } from "./settings.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { UpdateSettingsBody } from "./settings.validation";
import { config } from "../../config";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get("/settings", authMiddleware, settingsController.get);
router.put("/settings", authMiddleware, validate(UpdateSettingsBody), settingsController.update);
router.post("/settings/upload-logo", authMiddleware, upload.single("logo"), settingsController.uploadLogo);
router.delete("/settings/delete-logo", authMiddleware, settingsController.deleteLogo);
router.post("/settings/upload-upi-qr", authMiddleware, upload.single("qr"), settingsController.uploadUpiQr);
router.get("/settings/upi-qr", authMiddleware, settingsController.generateUpiQr);

export default router;
