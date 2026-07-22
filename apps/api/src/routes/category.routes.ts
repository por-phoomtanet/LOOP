import { Elysia } from "elysia";
import { z } from "zod";
import * as categoryController from "../controllers/category.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

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

export const categoryRoutes = new Elysia({ prefix: "/api/categories" })
  .use(authMacro)
  .get("/", ({ query }) => categoryController.list(query))
  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return categoryController.create(body, user.userId);
    },
    { ...validate({ body: createSchema }), auth: ["admin"] },
  )
  .put(
    "/:id",
    ({ params, body, user }) => categoryController.update(Number(params.id), body, user.userId),
    { ...validate({ body: updateSchema }), auth: ["admin"] },
  )
  .patch(
    "/:id/status",
    ({ params, body, user }) =>
      categoryController.updateStatus(Number(params.id), body, user.userId),
    { ...validate({ body: statusSchema }), auth: ["admin"] },
  )
  .delete("/:id", ({ params }) => categoryController.remove(Number(params.id)), {
    auth: ["admin"],
  });
