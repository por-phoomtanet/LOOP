import type { NextFunction, Request, Response } from "express";
import { getHealth } from "../services/health.service";

export async function health(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getHealth();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
