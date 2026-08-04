import * as rentalService from "../services/rental.service";
import { BadRequestError } from "../utils/errors";

export async function createRental(renterId: number, productId: number, body: unknown) {
  const input = body as { startDate: string; endDate: string };
  const result = await rentalService.createRental(renterId, productId, input);
  return { data: result, message: "ok" };
}

export async function getPaymentInfo(renterId: number, rentalId: number) {
  const result = await rentalService.getPaymentInfo(renterId, rentalId);
  return { data: result, message: "ok" };
}

export async function submitSlip(renterId: number, rentalId: number, file: File | undefined) {
  if (!file) throw new BadRequestError("กรุณาอัปโหลดรูปสลิป");
  const result = await rentalService.submitSlip(renterId, rentalId, file);
  return { data: result, message: "ok" };
}
