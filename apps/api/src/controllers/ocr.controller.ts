import { analyzeIdCard } from "../services/kyc/idCardAi";
import { BadRequestError } from "../utils/errors";

export async function ocrIdCard(file: File | undefined) {
  if (!file) throw new BadRequestError("กรุณาอัปโหลดรูปบัตรประชาชน");
  const result = await analyzeIdCard(file);
  return { data: result, message: "ok" };
}
