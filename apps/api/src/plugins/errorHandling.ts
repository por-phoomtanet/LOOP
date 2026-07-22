import { ZodError } from "zod";
import { HttpError } from "../utils/errors";

type SetLike = { status?: number | string };

// แทน middleware/errorHandler.ts (4-arg Express) → เรียกจาก Elysia .onError() บน main app instance
// รักษา order เดิม: ZodError → HttpError → fallback 500 และ shape เดิมเป๊ะ (test assert อยู่)
// เพิ่ม NOT_FOUND → 404 เพราะ Elysia default ให้ code นี้กับ route ที่ไม่ match (Express เดิมตอบ 404 เอง)
// รับ positional args เพื่อเลี่ยงการผูกกับ type ของ Elysia context (code เป็น union กว้าง)
export function handleError(code: string | number, error: unknown, set: SetLike) {
  if (error instanceof ZodError) {
    set.status = 400;
    return {
      error: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    };
  }
  if (error instanceof HttpError) {
    set.status = error.status;
    return { error: error.message };
  }
  if (code === "NOT_FOUND") {
    set.status = 404;
    return { error: "Not found" };
  }
  console.error(error);
  set.status = 500;
  return { error: "Internal server error" };
}
