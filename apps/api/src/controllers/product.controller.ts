import type { NextFunction, Request, Response } from "express";
import * as productService from "../services/product.service";

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.createListing(req.user!.userId, req.body);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = Number(req.params.id);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const result = await productService.addProductImages(
      req.user!.userId,
      productId,
      files.map((f) => f.filename),
    );
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
