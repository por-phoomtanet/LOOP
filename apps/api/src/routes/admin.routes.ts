import { Elysia } from "elysia";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import * as userController from "../controllers/user.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(authMacro)
  .guard({ auth: ["admin"] }, (app) =>
    app
      .get("/dashboard", () => userController.adminDashboard())
      .get("/users", ({ query }) => userController.adminListUsers(query))
      .patch(
        "/users/:id/status",
        ({ params, body }) => userController.adminUpdateStatus(Number(params.id), body),
        validate({ body: updateStatusSchema }),
      )
      .get("/products", () => productController.adminList()),
  );
