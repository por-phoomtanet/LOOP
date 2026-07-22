import { Elysia } from "elysia";
import { z } from "zod";
import * as rolePermissionController from "../controllers/rolePermission.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const updateSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

export const rolePermissionRoutes = new Elysia({ prefix: "/api/role-permissions" })
  .use(authMacro)
  .get("/:role", ({ params }) => rolePermissionController.getByRole(params.role), { auth: true })
  .put(
    "/:role/:menuKey",
    ({ params, body }) => rolePermissionController.update(params.role, params.menuKey, body),
    { ...validate({ body: updateSchema }), auth: ["admin"] },
  );
