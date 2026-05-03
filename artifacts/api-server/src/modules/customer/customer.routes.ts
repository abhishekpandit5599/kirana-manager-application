import { Router } from "express";
import { customerController } from "./customer.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { CreateCustomerBody, UpdateCustomerBody } from "./customer.validation";

const router = Router();

router.get("/customers", authMiddleware, customerController.list);
router.post("/customers", authMiddleware, validate(CreateCustomerBody), customerController.create);
router.get("/customers/:id", authMiddleware, customerController.get);
router.get("/customers/:id/stats", authMiddleware, customerController.stats);
router.patch("/customers/:id", authMiddleware, validate(UpdateCustomerBody), customerController.update);
router.delete("/customers/:id", authMiddleware, customerController.remove);

export default router;
