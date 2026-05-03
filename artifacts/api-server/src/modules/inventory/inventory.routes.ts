import { Router } from "express";
import multer from "multer";
import { inventoryController } from "./inventory.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { CreateItemBody, UpdateItemBody, AddDefaultItemsBody } from "./inventory.validation";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/items", authMiddleware, inventoryController.listItems);
router.post("/items", authMiddleware, validate(CreateItemBody), inventoryController.createItem);
router.get("/items/:id", authMiddleware, inventoryController.getItem);
router.patch("/items/:id", authMiddleware, validate(UpdateItemBody), inventoryController.updateItem);
router.delete("/items/:id", authMiddleware, inventoryController.deleteItem);

// Default items catalog
router.get("/inventory/default-items", authMiddleware, inventoryController.getDefaultItems);
router.post("/inventory/add-defaults", authMiddleware, validate(AddDefaultItemsBody), inventoryController.addDefaultItems);

// Excel features
router.get("/inventory/excel-template", authMiddleware, inventoryController.downloadTemplate);
router.post("/inventory/import-excel", authMiddleware, upload.single("file"), inventoryController.importExcel);
router.get("/inventory/export-excel", authMiddleware, inventoryController.exportExcel);

export default router;
