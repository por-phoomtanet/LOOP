import { Router } from "express";
import { z } from "zod";
import * as rolePermissionController from "../controllers/rolePermission.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

export const rolePermissionRouter = Router();

const updateSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

rolePermissionRouter.get("/:role", authenticate, rolePermissionController.getByRole);
rolePermissionRouter.put(
  "/:role/:menuKey",
  authenticate,
  requireRole("admin"),
  validate({ body: updateSchema }),
  rolePermissionController.update,
);
