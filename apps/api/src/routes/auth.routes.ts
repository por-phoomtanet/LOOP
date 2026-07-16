import { Router } from "express";
import { z } from "zod";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  accountType: z.enum(["INDIVIDUAL", "SHOP"]),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

const otpRequestSchema = z.object({
  method: z.enum(["email", "phone"]),
});

const otpVerifySchema = z.object({
  code: z.string().length(6),
});

authRouter.post("/login", validate({ body: loginSchema }), authController.login);
authRouter.post("/register", validate({ body: registerSchema }), authController.register);
authRouter.post(
  "/register/otp/request",
  authenticate,
  validate({ body: otpRequestSchema }),
  authController.requestOtp,
);
authRouter.post(
  "/register/otp/verify",
  authenticate,
  validate({ body: otpVerifySchema }),
  authController.verifyOtp,
);
