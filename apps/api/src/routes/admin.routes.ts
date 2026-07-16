import { Router } from "express";
import { z } from "zod";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));

const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

adminRouter.get("/users", userController.adminListUsers);
adminRouter.patch(
  "/users/:id/status",
  validate({ body: updateStatusSchema }),
  userController.adminUpdateStatus,
);
