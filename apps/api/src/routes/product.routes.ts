import { Elysia } from "elysia";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import { authMacro } from "../plugins/auth";
import { toFileArray } from "../plugins/upload";
import { validate } from "../plugins/validate";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.number().int().positive(),
  pricePerDay: z.number().positive(),
  location: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

const pickupOptionSchema = z.object({
  label: z.string().min(1),
});

export const productRoutes = new Elysia({ prefix: "/api/products" })
  .use(authMacro)
  .get("/", ({ query }) => productController.publicList(query))
  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return productController.create(body, user.userId);
    },
    { ...validate({ body: createSchema }), auth: true },
  )
  .put(
    "/:id",
    ({ params, body, user }) => productController.update(Number(params.id), body, user.userId),
    { ...validate({ body: updateSchema }), auth: true },
  )
  .patch(
    "/:id/status",
    ({ params, body, user }) =>
      productController.updateStatus(Number(params.id), body, user.userId),
    { ...validate({ body: statusSchema }), auth: true },
  )
  .delete("/:id", ({ params, user }) => productController.remove(Number(params.id), user.userId), {
    auth: true,
  })
  .post(
    "/:id/images",
    ({ params, body, user, set }) => {
      const files = toFileArray((body as { files?: unknown }).files);
      set.status = 201;
      return productController.uploadImages(Number(params.id), user.userId, files);
    },
    { auth: true },
  )
  .post(
    "/:id/pickup-options",
    ({ params, body, user, set }) => {
      set.status = 201;
      return productController.addPickupOption(Number(params.id), user.userId, body);
    },
    { ...validate({ body: pickupOptionSchema }), auth: true },
  )
  .delete(
    "/:id/pickup-options/:optionId",
    ({ params, user }) =>
      productController.removePickupOption(Number(params.id), Number(params.optionId), user.userId),
    { auth: true },
  );
