import { Elysia } from "elysia";
import { z } from "zod";
import * as roleController from "../controllers/role.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const createSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
});

export const roleRoutes = new Elysia({ prefix: "/api/roles" })
  .use(authMacro)
  .guard({ auth: ["admin"] }, (app) =>
    app
      .get("/", () => roleController.list())
      .post(
        "/",
        ({ body, set }) => {
          set.status = 201;
          return roleController.create(body);
        },
        validate({ body: createSchema }),
      )
      .put("/:id", ({ params, body }) => roleController.update(Number(params.id), body), {
        ...validate({ body: updateSchema }),
      })
      .delete("/:id", ({ params }) => roleController.remove(Number(params.id))),
  );
