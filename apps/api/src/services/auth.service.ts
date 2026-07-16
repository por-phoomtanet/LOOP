import bcrypt from "bcrypt";
import type { AccountType } from "@loop/db";
import { userRepository } from "../repositories/user.repository";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/errors";
import { signToken } from "../utils/jwt";
import { generateOtpCode, OTP_TTL_MINUTES } from "../utils/otp";

export async function login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new UnauthorizedError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

  const token = signToken({ userId: user.id, role: user.role.name });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      accountType: user.accountType,
    },
  };
}

export async function register(input: {
  accountType: AccountType;
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) throw new ConflictError("อีเมลนี้ถูกใช้แล้ว");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    accountType: input.accountType,
    passwordHash,
  });

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
    },
  };
}

export async function requestOtp(userId: number, method: "email" | "phone") {
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError();

  const code = generateOtpCode();
  const otpCodeHash = await bcrypt.hash(code, 10);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await userRepository.setOtp(userId, { otpCodeHash, otpExpiresAt, otpMethod: method });

  const destination = method === "email" ? user.email : user.phone;
  // โหมด mock: log รหัสแทนการส่งจริง — ไว้ต่อ SMS/Email provider ทีหลัง
  console.log(`[MOCK OTP] ส่งรหัส ${code} ไปยัง ${method} (${destination})`);

  return { method, destination };
}

export async function verifyOtp(userId: number, code: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError();

  if (!user.otpCodeHash || !user.otpExpiresAt) {
    throw new BadRequestError("ไม่พบคำขอ OTP กรุณาขอรหัสใหม่");
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new BadRequestError("รหัสหมดอายุ กรุณาขอรหัสใหม่");
  }

  const valid = await bcrypt.compare(code, user.otpCodeHash);
  if (!valid) throw new BadRequestError("รหัส OTP ไม่ถูกต้อง");

  await userRepository.verifyOtp(userId);
  return { verified: true };
}
