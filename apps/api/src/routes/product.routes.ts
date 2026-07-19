import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import { authenticate } from "../middleware/authenticate";
import { createImageUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";

export const productRouter = Router();

const productImageUpload = createImageUpload("products");

const createListingSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  description: z.string().trim().default(""),
  categoryId: z.number().int().positive("กรุณาเลือกหมวดหมู่"),
  pricePerDay: z.number().positive("ราคาต่อวันต้องมากกว่า 0"),
  pickupOptions: z.array(z.string().min(1)).default([]),
});

productRouter.post(
  "/",
  authenticate,
  validate({ body: createListingSchema }),
  productController.createListing,
);

productRouter.post(
  "/:id/images",
  authenticate,
  productImageUpload.array("files", 8),
  productController.uploadImages,
);
