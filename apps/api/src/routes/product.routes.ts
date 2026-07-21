import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import { authenticate } from "../middleware/authenticate";
import { createImageUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";

export const productRouter = Router();

const productImageUpload = createImageUpload("products");

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.number().int().positive(),
  pricePerDay: z.number().positive(),
  location: z.string().min(1),
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

const pickupOptionSchema = z.object({
  label: z.string().min(1),
});

productRouter.post("/", authenticate, validate({ body: createSchema }), productController.create);
productRouter.put("/:id", authenticate, validate({ body: updateSchema }), productController.update);
productRouter.patch(
  "/:id/status",
  authenticate,
  validate({ body: statusSchema }),
  productController.updateStatus,
);
productRouter.delete("/:id", authenticate, productController.remove);
productRouter.post(
  "/:id/images",
  authenticate,
  productImageUpload.array("files", 10),
  productController.uploadImages,
);
productRouter.post(
  "/:id/pickup-options",
  authenticate,
  validate({ body: pickupOptionSchema }),
  productController.addPickupOption,
);
productRouter.delete(
  "/:id/pickup-options/:optionId",
  authenticate,
  productController.removePickupOption,
);
