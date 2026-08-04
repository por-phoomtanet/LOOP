import { productRepository } from "../repositories/product.repository";
import { rentalRepository } from "../repositories/rental.repository";
import { paymentSlipRepository } from "../repositories/paymentSlip.repository";
import { publicUrlFor, saveImage } from "../plugins/upload";
import { analyzeSlip } from "./payment/slipAi";
import { diffInDays, resolveRentPrice } from "../utils/pricing";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

const MAX_SLIP_AGE_DAYS = 3;

export async function createRental(
  renterId: number,
  productId: number,
  input: { startDate: string; endDate: string },
) {
  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError("ไม่พบสินค้านี้");
  if (product.status !== "ACTIVE") throw new BadRequestError("สินค้านี้ยังไม่เปิดให้เช่า");

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const nights = diffInDays(startDate, endDate);
  const pricePerDaySnap = Number(product.pricePerDay);
  const totalAmount = resolveRentPrice(nights, {
    pricePerDay: pricePerDaySnap,
    price3Day: product.price3Day != null ? Number(product.price3Day) : null,
    price7Day: product.price7Day != null ? Number(product.price7Day) : null,
  });

  const rental = await rentalRepository.create({
    productId,
    renterId,
    ownerId: product.ownerId,
    startDate,
    endDate,
    nights,
    pricePerDaySnap,
    totalAmount,
  });

  return rental;
}

async function findOwnedRental(rentalId: number, renterId: number) {
  const rental = await rentalRepository.findById(rentalId);
  if (!rental) throw new NotFoundError("ไม่พบคำขอเช่านี้");
  if (rental.renterId !== renterId) throw new ForbiddenError("ไม่มีสิทธิ์เข้าถึงคำขอเช่านี้");
  return rental;
}

export async function getPaymentInfo(renterId: number, rentalId: number) {
  const rental = await findOwnedRental(rentalId, renterId);
  return {
    id: rental.id,
    productTitle: rental.product.title,
    totalAmount: rental.totalAmount,
    status: rental.status,
    ownerName: rental.owner.name,
    promptPayQrUrl: rental.owner.promptPayQrUrl,
  };
}

// normalize เว้นวรรค/คำนำหน้า ก่อนเทียบชื่อผู้รับในสลิปกับ legalName ของเจ้าของ
function normalizeName(name: string): string {
  return name
    .replace(/^(นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|Mr\.|Mrs\.|Miss)\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export async function submitSlip(renterId: number, rentalId: number, file: File) {
  const rental = await findOwnedRental(rentalId, renterId);
  if (rental.status === "PAID") throw new BadRequestError("คำขอเช่านี้ชำระเงินแล้ว");
  if (!rental.owner.legalName || !rental.owner.promptPayQrUrl) {
    throw new BadRequestError("เจ้าของสินค้ายังไม่ได้ตั้งค่าข้อมูลรับเงิน");
  }

  const analysis = await analyzeSlip(file);
  const filename = await saveImage("payment-slips", file);
  const imageUrl = publicUrlFor("payment-slips", filename);

  const rejection = await validateSlip(analysis, rental);
  const rawAnalysis = JSON.stringify(analysis);

  if (rejection) {
    await paymentSlipRepository.create({
      rentalId,
      imageUrl,
      amount: analysis.amount ?? 0,
      transferredAt: parseSlipDate(analysis.date, analysis.time) ?? new Date(),
      reference: analysis.reference ?? `invalid-${Date.now()}-${rentalId}`,
      senderName: analysis.senderName,
      receiverName: analysis.receiverName,
      bank: analysis.bank,
      verified: false,
      rejectedReason: rejection,
      rawAnalysis,
    });
    return { verified: false, reason: rejection };
  }

  await paymentSlipRepository.create({
    rentalId,
    imageUrl,
    amount: analysis.amount!,
    transferredAt: parseSlipDate(analysis.date, analysis.time) ?? new Date(),
    reference: analysis.reference!,
    senderName: analysis.senderName,
    receiverName: analysis.receiverName,
    bank: analysis.bank,
    verified: true,
    rejectedReason: null,
    rawAnalysis,
  });
  await rentalRepository.setStatus(rentalId, "PAID");

  return { verified: true, reason: null };
}

function parseSlipDate(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const parsed = new Date(time ? `${date}T${time}:00` : `${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type RentalForValidation = Awaited<ReturnType<typeof rentalRepository.findById>>;

async function validateSlip(
  analysis: Awaited<ReturnType<typeof analyzeSlip>>,
  rental: NonNullable<RentalForValidation>,
): Promise<string | null> {
  if (!analysis.valid) return "รูปนี้ไม่ใช่สลิปโอนเงิน";
  if (!analysis.amount || analysis.amount <= 0) return "อ่านยอดเงินไม่ได้";
  if (!analysis.reference) return "ไม่พบเลขอ้างอิง/เลขรายการ";
  if (!analysis.senderName) return "ไม่พบชื่อผู้โอน";

  const existing = await paymentSlipRepository.findByReference(analysis.reference);
  if (existing) {
    throw new ConflictError("สลิปนี้ถูกใช้งานไปแล้ว");
  }

  if (Number(analysis.amount) !== Number(rental.totalAmount)) {
    return `ยอดเงินไม่ตรงกับราคาเช่า (ได้รับ ${analysis.amount} บาท ต้องการ ${rental.totalAmount} บาท)`;
  }

  if (
    !analysis.receiverName ||
    normalizeName(analysis.receiverName) !== normalizeName(rental.owner.legalName!)
  ) {
    return "ชื่อผู้รับในสลิปไม่ตรงกับเจ้าของสินค้า";
  }

  const transferredAt = parseSlipDate(analysis.date, analysis.time);
  if (!transferredAt) return "อ่านวันที่ไม่ได้";
  const ageDays = (Date.now() - transferredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > MAX_SLIP_AGE_DAYS) return `สลิปเก่าเกินไป (ต้องไม่เกิน ${MAX_SLIP_AGE_DAYS} วัน)`;

  return null;
}
