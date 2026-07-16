import type { NextFunction, Request, Response } from "express";
import * as userService from "../services/user.service";
import { BadRequestError } from "../utils/errors";

export async function uploadIdCard(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = Number(req.params.id);
    if (!req.file) throw new BadRequestError("กรุณาอัปโหลดรูปบัตรประชาชน");

    const result = await userService.uploadIdCard(
      req.user!.userId,
      targetUserId,
      req.file.filename,
    );
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export function ocrMock(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = Number(req.params.id);
    const result = userService.getMockOcrResult(req.user!.userId, targetUserId);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function faceVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = Number(req.params.id);
    const result = await userService.verifyFace(req.user!.userId, targetUserId);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function adminListUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.listUsers();
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = Number(req.params.id);
    const result = await userService.updateVerificationStatus(targetUserId, req.body.status);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
