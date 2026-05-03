import { Router } from "express";
import { labourController } from "./labour.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { CreateLabourBody, UpdateLabourBody, MarkAttendanceBody } from "./labour.validation";

const router = Router();

router.get("/labour", authMiddleware, labourController.list);
router.post("/labour", authMiddleware, validate(CreateLabourBody), labourController.create);
router.get("/labour/:id", authMiddleware, labourController.get);
router.patch("/labour/:id", authMiddleware, validate(UpdateLabourBody), labourController.update);
router.delete("/labour/:id", authMiddleware, labourController.remove);
router.get("/labour/:id/salary", authMiddleware, labourController.salary);
router.get("/attendance", authMiddleware, labourController.listAttendance);
router.post("/attendance", authMiddleware, validate(MarkAttendanceBody), labourController.markAttendance);

export default router;
