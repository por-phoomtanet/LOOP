import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import * as userLocationController from "../controllers/userLocation.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

export const meRouter = Router();

const locationSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

meRouter.use(authenticate);
meRouter.get("/listings", productController.myListings);
meRouter.get("/locations", userLocationController.list);
meRouter.post("/locations", validate({ body: locationSchema }), userLocationController.create);
meRouter.delete("/locations/:id", userLocationController.remove);
