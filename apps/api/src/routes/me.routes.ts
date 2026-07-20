import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate } from "../middleware/authenticate";

export const meRouter = Router();

meRouter.use(authenticate);
meRouter.get("/listings", productController.myListings);
