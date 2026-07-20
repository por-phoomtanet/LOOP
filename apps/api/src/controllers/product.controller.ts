import type { NextFunction, Request, Response } from "express";
import * as productService from "../services/product.service";
import { BadRequestError } from "../utils/errors";

export async function adminList(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.listProductsForAdmin();
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.createProduct(req.body, req.user!.userId);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.updateProduct(
      Number(req.params.id),
      req.body,
      req.user!.userId,
    );
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.setProductStatus(
      Number(req.params.id),
      req.body.status,
      req.user!.userId,
    );
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(Number(req.params.id), req.user!.userId);
    res.json({ data: null, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new BadRequestError("กรุณาอัปโหลดรูปอย่างน้อย 1 รูป");

    const result = await productService.addProductImages(
      Number(req.params.id),
      req.user!.userId,
      files,
    );
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function addPickupOption(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.addPickupOption(
      Number(req.params.id),
      req.user!.userId,
      req.body.label,
    );
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function removePickupOption(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.removePickupOption(
      Number(req.params.id),
      Number(req.params.optionId),
      req.user!.userId,
    );
    res.json({ data: null, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function myListings(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.listMyListings(req.user!.userId);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
