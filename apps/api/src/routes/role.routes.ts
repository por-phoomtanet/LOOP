import { Router } from "express";
import { z } from "zod";
import * as roleController from "../controllers/role.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

export const roleRouter = Router();

roleRouter.use(authenticate, requireRole("admin"));

const createSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
});

roleRouter.get("/", roleController.list);
roleRouter.post("/", validate({ body: createSchema }), roleController.create);
roleRouter.put("/:id", validate({ body: updateSchema }), roleController.update);
roleRouter.delete("/:id", roleController.remove);
