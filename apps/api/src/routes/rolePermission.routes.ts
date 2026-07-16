import { Router } from "express";
import * as rolePermissionController from "../controllers/rolePermission.controller";
import { authenticate } from "../middleware/authenticate";

export const rolePermissionRouter = Router();

rolePermissionRouter.get("/:role", authenticate, rolePermissionController.getByRole);
