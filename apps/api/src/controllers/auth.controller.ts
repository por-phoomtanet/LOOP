import * as authService from "../services/auth.service";

// controllers = pure functions: รับ input ที่ผ่าน validate แล้ว → เรียก service → คืน envelope
// try/catch หายไป (Elysia onError จัดการ error กลาง), status 201 ตั้งใน route

type LoginInput = { email: string; password: string };
type RegisterInput = Parameters<typeof authService.register>[0];

export async function login(body: unknown) {
  const { email, password } = body as LoginInput;
  const result = await authService.login(email, password);
  return { data: result, message: "ok" };
}

export async function register(body: unknown) {
  const result = await authService.register(body as RegisterInput);
  return { data: result, message: "ok" };
}

export async function requestOtp(userId: number, body: unknown) {
  const { method } = body as { method: "email" | "phone" };
  const result = await authService.requestOtp(userId, method);
  return { data: result, message: "ok" };
}

export async function verifyOtp(userId: number, body: unknown) {
  const { code } = body as { code: string };
  const result = await authService.verifyOtp(userId, code);
  return { data: result, message: "ok" };
}
