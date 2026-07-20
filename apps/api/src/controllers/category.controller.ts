import type { NextFunction, Request, Response } from "express";
import * as categoryService from "../services/category.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status === "all" ? "all" : "active";
    const result = await categoryService.listCategories(status);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoryService.createCategory(req.body, req.user!.userId);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoryService.updateCategory(
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
    const result = await categoryService.setCategoryStatus(
      Number(req.params.id),
      req.body.isActive,
      req.user!.userId,
    );
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    res.json({ data: null, message: "ok" });
  } catch (err) {
    next(err);
  }
}
