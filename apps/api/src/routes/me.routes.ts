import { Elysia } from "elysia";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import * as userLocationController from "../controllers/userLocation.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const locationSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

export const meRoutes = new Elysia({ prefix: "/api/me" })
  .use(authMacro)
  .guard({ auth: true }, (app) =>
    app
      .get("/listings", ({ user }) => productController.myListings(user.userId))
      .get("/locations", ({ user }) => userLocationController.list(user.userId))
      .post(
        "/locations",
        ({ user, body, set }) => {
          set.status = 201;
          return userLocationController.create(user.userId, body);
        },
        validate({ body: locationSchema }),
      )
      .delete("/locations/:id", ({ user, params }) =>
        userLocationController.remove(user.userId, Number(params.id)),
      ),
  );
