import { BadRequestError } from "../../utils/errors";
import { OTP_TTL_MINUTES } from "../../utils/otp";

// ส่งอีเมลจริงผ่าน Resend REST API — pattern เดียวกับ services/payment/slipAi.ts
// (เรียก fetch ตรงๆ ไม่ลง SDK, อ่าน API key แบบ lazy) ดู CLAUDE.md Dev Standard #25
const RESEND_API_URL = "https://api.resend.com/emails";

function getConfig() {
  const apiKey = process.env.RESEND_KEY;
  if (!apiKey) {
    throw new BadRequestError("ยังไม่ได้ตั้งค่า RESEND_KEY — ติดต่อผู้ดูแลระบบ");
  }
  // ต้อง verify domain ที่ Resend ก่อนถึงจะส่งหาอีเมลผู้ใช้ทั่วไปได้จริง — ถ้ายังไม่ verify
  // ตั้ง RESEND_FROM_EMAIL เป็น onboarding@resend.dev ได้ (ส่งได้แค่หาอีเมลเจ้าของบัญชี Resend เอง)
  // ใช้ || ไม่ใช่ ?? เพราะ docker-compose ตั้ง env ที่ไม่ได้กำหนดค่าให้เป็น "" (empty string)
  // ไม่ใช่ undefined — ?? จะไม่ fallback ให้ในกรณีนั้น
  const from = process.env.RESEND_FROM_EMAIL || " <no-reply.system@rently.com>";
  return { apiKey, from };
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const { apiKey, from } = getConfig();

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `รหัสยืนยันตัวตน renty: ${code}`,
      html: `<p>รหัสยืนยันตัวตนของคุณคือ</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>รหัสนี้หมดอายุใน ${OTP_TTL_MINUTES} นาที ถ้าคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>`,
    }),
  });

  if (!response.ok) {
    throw new BadRequestError(`ส่งอีเมล OTP ไม่สำเร็จ (Resend ตอบกลับ ${response.status})`);
  }
}
