import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BadRequestError } from "../utils/errors";

// แทน middleware/upload.ts (multer disk-storage) → Bun.write() บน Web File object ของ Elysia
// รักษา convention เดิม: uploads/<subdir>/, ชื่อไฟล์ ${Date.now()}-${rand}${ext}, 5MB, mime allowlist
const UPLOAD_ROOT = path.resolve(import.meta.dir, "../../uploads");
// "image/jpg" ไม่ใช่ mime มาตรฐาน (ของจริงคือ image/jpeg) แต่บาง browser/OS ส่งมาแบบนี้กับไฟล์ .jpg — รับไว้ทั้งคู่
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg"]);
const MAX_SIZE = 5 * 1024 * 1024;
// ด้านยาวสุดหลัง resize — เกินพอสำหรับแสดงผลบนเว็บ รูปจากมือถือมักเกิน 3000-4000px
// ทั้งที่หน้าเว็บโชว์จริงไม่กี่ร้อย px ทำให้พื้นที่เก็บโตเกินจำเป็น (ดู CLAUDE.md Phase 18)
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 85;

// เขียนไฟล์ลง disk แล้วคืนชื่อไฟล์ที่ generate — validate mime/size เอง (แทน multer fileFilter/limits)
// resize+บีบอัดด้วย sharp ก่อนเขียนเสมอ (ไม่กระทบ OCR/slip verification เพราะจุดนั้นวิเคราะห์จาก
// ไฟล์ต้นฉบับก่อนเรียก saveImage() อยู่แล้ว — ดู rental.service.ts::submitSlip / ocr.routes.ts)
export async function saveImage(subdir: string, file: File): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new BadRequestError("รองรับเฉพาะไฟล์รูปภาพ JPG, JPEG หรือ PNG เท่านั้น");
  }
  if (file.size > MAX_SIZE) {
    throw new BadRequestError("ไฟล์มีขนาดใหญ่เกิน 5MB");
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  // เก็บนามสกุลตาม mime ที่ตรวจแล้วจริง (ไม่เชื่อ path.extname(file.name) เฉยๆ) เพราะเนื้อไฟล์
  // ที่เขียนลง disk ถูก re-encode ใหม่หมดแล้ว นามสกุลต้องตรงกับ format ที่ encode จริง
  const isPng = file.type === "image/png";
  const ext = isPng ? ".png" : ".jpg";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const input = Buffer.from(await file.arrayBuffer());
  const resized = sharp(input).resize(MAX_DIMENSION, MAX_DIMENSION, {
    fit: "inside",
    withoutEnlargement: true,
  });
  // PNG (ส่วนใหญ่คือ QR พร้อมเพย์ ขอบคมชัด) เก็บแบบ lossless ต่อไป แค่ลดจำนวนพิกเซล — ไม่บีบ
  // แบบ lossy เพราะเสี่ยงทำให้ QR สแกนไม่ติด ส่วน JPEG (รูปถ่ายจริงส่วนใหญ่) บีบด้วย quality 85
  const output = isPng
    ? await resized.png({ compressionLevel: 9 }).toBuffer()
    : await resized.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

  await Bun.write(path.join(dir, filename), output);
  return filename;
}

// normalize body field ที่อาจเป็น File เดี่ยวหรือ File[] (multipart หลายไฟล์ field เดียวกัน) → File[]
export function toFileArray(value: unknown): File[] {
  if (Array.isArray(value)) return value.filter((f): f is File => f instanceof File);
  if (value instanceof File) return [value];
  return [];
}

export { UPLOAD_ROOT };

export function publicUrlFor(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`;
}
