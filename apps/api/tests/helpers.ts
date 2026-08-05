import { prisma } from "@loop/db";
import request from "supertest";
import { baseUrl } from "./testApp";

export function uniqueEmail(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`;
}

// สร้าง SignupOtp ที่ verifiedAt ตรงๆ ผ่าน Prisma แทนยิง /signup-otp/request+verify จริง —
// เร็วกว่ามาก (ไม่ต้อง mock fetch ของ Resend ในทุกที่ที่เรียก registerUser()) และ POST
// /api/auth/register บังคับให้ต้องมี SignupOtp.verifiedAt ของอีเมลนั้นก่อนเสมอ (ดู auth.service.ts)
export async function markEmailVerified(email: string) {
  await prisma.signupOtp.create({
    data: {
      email,
      codeHash: "test",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verifiedAt: new Date(),
    },
  });
}

export async function registerUser(prefix: string) {
  const email = uniqueEmail(prefix);
  await markEmailVerified(email);
  const res = await request(baseUrl).post("/api/auth/register").send({
    accountType: "INDIVIDUAL",
    name: "Test User",
    email,
    phone: "0812345678",
    password: "password123",
    pdpaConsent: true,
  });
  return { email, token: res.body.data.token as string, userId: res.body.data.user.id as number };
}
