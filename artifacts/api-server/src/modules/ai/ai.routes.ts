import { Router } from "express";
import multer from "multer";
import { aiController } from "./ai.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { ProcessVoiceBody } from "./ai.validation";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/ai/ocr", authMiddleware, upload.single("image"), aiController.processOcr);
router.post("/ai/voice", authMiddleware, validate(ProcessVoiceBody), aiController.processVoice);

export default router;
