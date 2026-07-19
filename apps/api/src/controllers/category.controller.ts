import type { NextFunction, Request, Response } from "express";
import * as categoryService from "../services/category.service";

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoryService.listActiveCategories();
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
