import type { NextFunction, Request, Response } from "express";
import * as rolePermissionService from "../services/rolePermission.service";

export async function getByRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await rolePermissionService.getPermissionsForRole(req.params.role);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
