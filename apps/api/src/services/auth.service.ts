import type { AccountType } from "@loop/db";
import { userRepository } from "../repositories/user.repository";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/errors";
import { signToken } from "../utils/jwt";
import { generateOtpCode, OTP_TTL_MINUTES } from "../utils/otp";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendOtpEmail } from "./email/resend";

export async function login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new UnauthorizedError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

  const valid = await verifyPassword(password, user.passwordHash);
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
  idCardNumber?: string;
  idCardNameTh?: string;
  idCardNameEn?: string;
  idCardAddress?: string;
  idCardDob?: string;
  pdpaConsent: true;
}) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) throw new ConflictError("อีเมลนี้ถูกใช้แล้ว");

  if (input.idCardNumber) {
    const existingIdCard = await userRepository.findByIdCardNumber(input.idCardNumber);
    if (existingIdCard) throw new ConflictError("บัตรประชาชนนี้ถูกใช้สมัครสมาชิกไปแล้ว");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    accountType: input.accountType,
    passwordHash,
    ...(input.idCardNumber ? { idCardNumber: input.idCardNumber } : {}),
    ...(input.idCardNameTh ? { idCardNameTh: input.idCardNameTh } : {}),
    ...(input.idCardNameEn ? { idCardNameEn: input.idCardNameEn } : {}),
    ...(input.idCardAddress ? { idCardAddress: input.idCardAddress } : {}),
    ...(input.idCardDob ? { idCardDob: new Date(input.idCardDob) } : {}),
    pdpaConsentedAt: new Date(),
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

export async function requestOtp(userId: number) {
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError();

  const code = generateOtpCode();
  const otpCodeHash = await hashPassword(code);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await userRepository.setOtp(userId, { otpCodeHash, otpExpiresAt, otpMethod: "email" });
  await sendOtpEmail(user.email, code);

  return { method: "email" as const, destination: user.email };
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

  const valid = await verifyPassword(code, user.otpCodeHash);
  if (!valid) throw new BadRequestError("รหัส OTP ไม่ถูกต้อง");

  await userRepository.verifyOtp(userId);
  return { verified: true };
}
