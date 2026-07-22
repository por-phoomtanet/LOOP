import { userRepository } from "../repositories/user.repository";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { publicUrlFor } from "../plugins/upload";

const MOCK_OCR_RESULT = {
  name: "SOMCHAI JAIDEE",
  idNumber: "1-2345-67890-12-3",
  dob: "1995-05-12",
  expiry: "2030-05-12",
};

function assertOwner(actingUserId: number, targetUserId: number) {
  if (actingUserId !== targetUserId) {
    throw new ForbiddenError("แก้ไขได้เฉพาะบัญชีของตัวเอง");
  }
}

export async function uploadIdCard(actingUserId: number, targetUserId: number, filename: string) {
  assertOwner(actingUserId, targetUserId);
  const url = publicUrlFor("id-cards", filename);
  await userRepository.setIdCardImage(targetUserId, url);
  return { idCardImageUrl: url };
}

export function getMockOcrResult(actingUserId: number, targetUserId: number) {
  assertOwner(actingUserId, targetUserId);
  return MOCK_OCR_RESULT;
}

export async function verifyFace(actingUserId: number, targetUserId: number) {
  assertOwner(actingUserId, targetUserId);
  await userRepository.setFaceVerified(targetUserId);
  return { faceVerified: true };
}

export async function listUsers() {
  const users = await userRepository.findAll();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    accountType: u.accountType,
    verificationStatus: u.verificationStatus,
    createdAt: u.createdAt,
  }));
}

export async function updateVerificationStatus(id: number, status: "APPROVED" | "REJECTED") {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("ไม่พบผู้ใช้นี้");

  const updated = await userRepository.setVerificationStatus(id, status);
  return { id: updated.id, verificationStatus: updated.verificationStatus };
}

export async function getDashboardStats() {
  const [totalUsers, pendingUsers] = await Promise.all([
    userRepository.countAll(),
    userRepository.countPending(),
  ]);

  return {
    users: { total: totalUsers, pending: pendingUsers },
    // ยังไม่มี Product/Rental/Category model (ดู Phase 4 note ใน CLAUDE.md) — null = ยังไม่เปิดใช้งาน ไม่ใช่ 0 จริง
    products: null,
    orders: null,
    grossRentalValue: null,
    categories: null,
    activeListings: null,
  };
}
