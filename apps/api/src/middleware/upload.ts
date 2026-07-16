import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { BadRequestError } from "../utils/errors";

const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function storageFor(subdir: string) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

export function createImageUpload(subdir: string) {
  return multer({
    storage: storageFor(subdir),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        cb(new BadRequestError("รองรับเฉพาะไฟล์รูปภาพ PNG, JPEG, WEBP เท่านั้น"));
        return;
      }
      cb(null, true);
    },
  });
}

export function publicUrlFor(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`;
}
