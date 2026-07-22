import { Elysia } from "elysia";
import { z } from "zod";
import * as authController from "../controllers/auth.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

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

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(authMacro)
  .post("/login", ({ body }) => authController.login(body), validate({ body: loginSchema }))
  .post(
    "/register",
    ({ body, set }) => {
      set.status = 201;
      return authController.register(body);
    },
    validate({ body: registerSchema }),
  )
  .post("/register/otp/request", ({ user, body }) => authController.requestOtp(user.userId, body), {
    ...validate({ body: otpRequestSchema }),
    auth: true,
  })
  .post("/register/otp/verify", ({ user, body }) => authController.verifyOtp(user.userId, body), {
    ...validate({ body: otpVerifySchema }),
    auth: true,
  });
