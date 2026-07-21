import type { NextFunction, Request, Response } from "express";
import * as roleService from "../services/role.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await roleService.listRoles();
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await roleService.createRole(req.body);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await roleService.updateRole(Number(req.params.id), req.body);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await roleService.deleteRole(Number(req.params.id));
    res.json({ data: null, message: "ok" });
  } catch (err) {
    next(err);
  }
}
