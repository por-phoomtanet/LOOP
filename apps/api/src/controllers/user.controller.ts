import * as userService from "../services/user.service";
import { saveImage } from "../plugins/upload";
import { BadRequestError } from "../utils/errors";

export async function uploadIdCard(
  actingUserId: number,
  targetUserId: number,
  file: File | undefined,
) {
  if (!file) throw new BadRequestError("กรุณาอัปโหลดรูปบัตรประชาชน");
  const filename = await saveImage("id-cards", file);
  const result = await userService.uploadIdCard(actingUserId, targetUserId, filename);
  return { data: result, message: "ok" };
}

export function ocrMock(actingUserId: number, targetUserId: number) {
  const result = userService.getMockOcrResult(actingUserId, targetUserId);
  return { data: result, message: "ok" };
}

export async function faceVerify(actingUserId: number, targetUserId: number) {
  const result = await userService.verifyFace(actingUserId, targetUserId);
  return { data: result, message: "ok" };
}

export async function adminListUsers() {
  const result = await userService.listUsers();
  return { data: result, message: "ok" };
}

export async function adminUpdateStatus(targetUserId: number, body: unknown) {
  const { status } = body as { status: "APPROVED" | "REJECTED" };
  const result = await userService.updateVerificationStatus(targetUserId, status);
  return { data: result, message: "ok" };
}

export async function adminDashboard() {
  const result = await userService.getDashboardStats();
  return { data: result, message: "ok" };
}
