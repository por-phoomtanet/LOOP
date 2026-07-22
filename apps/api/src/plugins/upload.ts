import fs from "node:fs";
import path from "node:path";
import { BadRequestError } from "../utils/errors";

// แทน middleware/upload.ts (multer disk-storage) → Bun.write() บน Web File object ของ Elysia
// รักษา convention เดิม: uploads/<subdir>/, ชื่อไฟล์ ${Date.now()}-${rand}${ext}, 5MB, mime allowlist
const UPLOAD_ROOT = path.resolve(import.meta.dir, "../../uploads");
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

// เขียนไฟล์ลง disk แล้วคืนชื่อไฟล์ที่ generate — validate mime/size เอง (แทน multer fileFilter/limits)
export async function saveImage(subdir: string, file: File): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new BadRequestError("รองรับเฉพาะไฟล์รูปภาพ PNG, JPEG, WEBP เท่านั้น");
  }
  if (file.size > MAX_SIZE) {
    throw new BadRequestError("ไฟล์มีขนาดใหญ่เกิน 5MB");
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await Bun.write(path.join(dir, filename), file);
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
