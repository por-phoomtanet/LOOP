import type { NextFunction, Request, Response } from "express";
import * as userLocationService from "../services/userLocation.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userLocationService.listMyLocations(req.user!.userId);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userLocationService.createMyLocation(req.user!.userId, req.body);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await userLocationService.deleteMyLocation(req.user!.userId, Number(req.params.id));
    res.json({ data: null, message: "ok" });
  } catch (err) {
    next(err);
  }
}
