import { Elysia } from "elysia";
import * as ocrController from "../controllers/ocr.controller";

// public เจตนา — รันก่อนมีบัญชีผู้ใช้ (ระหว่างกรอกฟอร์มสมัคร) ไม่บันทึกอะไรลง DB ที่นี่
// ดู CLAUDE.md Dev Standard #24
export const ocrRoutes = new Elysia({ prefix: "/api/ocr" }).post("/id-card", ({ body }) => {
  const file = (body as { file?: unknown } | undefined)?.file;
  return ocrController.ocrIdCard(file instanceof File ? file : undefined);
});
