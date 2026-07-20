import { Router } from "express";
import { z } from "zod";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

export const categoryRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
});

const statusSchema = z.object({
  isActive: z.boolean(),
});

categoryRouter.get("/", categoryController.list);
categoryRouter.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate({ body: createSchema }),
  categoryController.create,
);
categoryRouter.put(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate({ body: updateSchema }),
  categoryController.update,
);
categoryRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("admin"),
  validate({ body: statusSchema }),
  categoryController.updateStatus,
);
categoryRouter.delete("/:id", authenticate, requireRole("admin"), categoryController.remove);
