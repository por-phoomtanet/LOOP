import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
