import { BadRequestError } from "../../utils/errors";

// วิเคราะห์รูปสลิปโอนเงินด้วย vision-capable LLM ผ่าน OpenRouter — ย้าย prompt/parsing มาจาก
// telegrom-bot-group/apps/bot/src/services/ai.ts (โปรเจกต์ตรวจสลิป Telegram bot ที่ใช้งานได้จริงแล้ว)
// ดูกฎการเรียก provider ภายนอกใน CLAUDE.md Dev Standard #23
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SLIP_PROMPT = `วิเคราะห์สลิปโอนเงินในรูปนี้ แล้วตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น

รูปแบบ JSON ที่ต้องการ:
{
  "amount": <ยอดเงิน เป็นตัวเลข ไม่มีหน่วย>,
  "date": "<วันที่ รูปแบบ YYYY-MM-DD>",
  "time": "<เวลา รูปแบบ HH:MM>",
  "reference": "<เลขอ้างอิง หรือ เลขรายการ>",
  "senderName": "<ชื่อผู้โอน>",
  "receiverName": "<ชื่อผู้รับ>",
  "bank": "<ชื่อธนาคาร>",
  "valid": <true ถ้าเป็นสลิปจริง, false ถ้าไม่ใช่>
}

ถ้าอ่านข้อมูลไม่ได้ให้ใส่ null ในช่องนั้น`;

export type SlipAnalysis = {
  amount: number | null;
  date: string | null;
  time: string | null;
  reference: string | null;
  senderName: string | null;
  receiverName: string | null;
  bank: string | null;
  valid: boolean;
};

type OpenRouterResponse = {
  choices: { message: { content: string } }[];
};

function getConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    throw new BadRequestError("ยังไม่ได้ตั้งค่า OpenRouter API key/model — ติดต่อผู้ดูแลระบบ");
  }
  return { apiKey, model };
}

export async function analyzeSlip(file: File): Promise<SlipAnalysis> {
  const { apiKey, model } = getConfig();
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Image = buffer.toString("base64");

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      // OCR = งาน extract ตรงๆ ต้อง 0 เสมอ — ค่า default (1.0) ทำให้โมเดลแต่งยอดเงิน/ชื่อ
      // ที่ดูสมเหตุสมผลขึ้นมาเองตอนอ่านไม่ออก ซึ่งอันตรายมากกับการตรวจสลิป
      temperature: 0,
      // จำกัดให้ route ไปเฉพาะ provider ที่ไม่เก็บ/ไม่ train ข้อมูล — สลิปมีชื่อ-นามสกุลจริงของผู้ใช้
      // ดู CLAUDE.md Dev Standard #23
      provider: { data_collection: "deny" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: "text", text: SLIP_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new BadRequestError(`ตรวจสอบสลิปไม่สำเร็จ (OpenRouter ตอบกลับ ${response.status})`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message.content ?? "";

  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new BadRequestError("อ่านผลตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่");

  return JSON.parse(json) as SlipAnalysis;
}
