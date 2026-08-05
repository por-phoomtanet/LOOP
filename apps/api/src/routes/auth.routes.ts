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
  // ผลจาก OCR ที่ผู้ใช้ตรวจ/แก้ไขแล้ว (Phase 11) — ไม่บังคับ ผู้ใช้อาจข้ามการอัปโหลดบัตรได้
  idCardNumber: z.string().min(1).optional(),
  idCardNameTh: z.string().min(1).optional(),
  idCardNameEn: z.string().min(1).optional(),
  idCardAddress: z.string().min(1).optional(),
  idCardDob: z.string().min(1).optional(),
  // บังคับต้องเป็น true เท่านั้น — ห้ามสมัครโดยไม่ติ๊กยอมรับ PDPA
  pdpaConsent: z.literal(true, { message: "กรุณายอมรับเงื่อนไข PDPA ก่อนสมัครสมาชิก" }),
});

const otpVerifySchema = z.object({
  code: z.string().length(6),
});

const signupOtpRequestSchema = z.object({
  email: z.string().email(),
});

const signupOtpVerifySchema = z.object({
  email: z.string().email(),
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
  .post("/register/otp/request", ({ user }) => authController.requestOtp(user.userId), {
    auth: true,
  })
  .post("/register/otp/verify", ({ user, body }) => authController.verifyOtp(user.userId, body), {
    ...validate({ body: otpVerifySchema }),
    auth: true,
  })
  // ยืนยันอีเมลก่อนสร้างบัญชี — ยังไม่มี user จริงตอนนี้ จึงไม่ auth ผูกด้วย email แทน userId
  .post(
    "/signup-otp/request",
    ({ body }) => authController.requestSignupOtp(body),
    validate({ body: signupOtpRequestSchema }),
  )
  .post(
    "/signup-otp/verify",
    ({ body }) => authController.verifySignupOtp(body),
    validate({ body: signupOtpVerifySchema }),
  );
