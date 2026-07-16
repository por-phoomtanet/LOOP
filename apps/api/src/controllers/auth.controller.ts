import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function requestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { method } = req.body;
    const result = await authService.requestOtp(req.user!.userId, method);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const result = await authService.verifyOtp(req.user!.userId, code);
    res.json({ data: result, message: "ok" });
  } catch (err) {
    next(err);
  }
}
