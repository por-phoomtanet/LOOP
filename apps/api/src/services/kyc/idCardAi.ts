import { BadRequestError } from "../../utils/errors";

// วิเคราะห์รูปบัตรประชาชนไทยด้วย vision-capable LLM ผ่าน OpenRouter — pattern เดียวกับ
// services/payment/slipAi.ts (Phase 10) ดูกฎการเรียก provider ภายนอกใน CLAUDE.md Dev Standard #24
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const ID_CARD_PROMPT = `คุณเป็นระบบ OCR สำหรับอ่านข้อความจากบัตรประชาชนไทย

กฎสำคัญ:
1. คัดลอกข้อความตามภาพทีละตัวอักษร ห้ามแก้คำ ห้ามเดาชื่อ
2. ห้ามเปลี่ยนชื่อให้เป็นชื่อที่พบบ่อยกว่า
3. ภาษาอังกฤษต้องคัดลอกตามบรรทัดภาษาอังกฤษบนบัตร
   ห้ามแปลหรือสร้างจากชื่อภาษาไทย
4. หากอักขระใดอ่านไม่ชัด ให้ใส่ ? ตรงตำแหน่งนั้น
   ห้ามคาดเดาอักขระที่มองไม่เห็น
5. ตรวจสอบชื่อและนามสกุลซ้ำอย่างน้อย 2 รอบก่อนตอบ
6. ให้คืนข้อความตามที่พิมพ์อยู่บนบัตรเท่านั้น
7. ห้ามเติมคำนำหน้าชื่อ ถ้าไม่เห็นชัดในภาพ
8. ที่อยู่ (แถว "ที่อยู่") ให้คืนเฉพาะข้อความที่อยู่เท่านั้น ห้ามใส่คำว่า "ที่อยู่" หรือวันที่ใดๆ ปนอยู่ (วันออกบัตร/วันหมดอายุเป็นคนละฟิลด์ ไม่เกี่ยวกับที่อยู่)
9. วันเกิดให้แปลงจาก พ.ศ. เป็น ค.ศ. แต่ห้ามแก้ข้อมูลส่วนอื่น

ตัวอย่าง:
หากเห็น "ภูมิธเนศ อินทยุง"
ต้องคืน "ภูมิธเนศ อินทยุง"
ห้ามเปลี่ยนเป็นชื่อที่สะกดใกล้เคียง

คืน JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON:
{
  "idNumber": "",
  "nameTh": "",
  "nameEn": "",
  "address": "",
  "dob": "YYYY-MM-DD",
  "valid": true,
  "uncertainFields": [],
  "confidence": {
    "idNumber": 0,
    "nameTh": 0,
    "nameEn": 0,
    "address": 0,
    "dob": 0
  }
}`;

export type IdCardAnalysis = {
  idNumber: string | null;
  nameTh: string | null;
  nameEn: string | null;
  address: string | null;
  dob: string | null;
  valid: boolean;
  uncertainFields?: string[];
  confidence?: Record<string, number>;
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

export async function analyzeIdCard(file: File): Promise<IdCardAnalysis> {
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
      // จำกัดให้ route ไปเฉพาะ provider ที่ไม่เก็บ/ไม่ train ข้อมูล — รูปบัตรมี PII เต็มใบ
      // (เลขบัตร/ชื่อ/ที่อยู่/วันเกิด/รูปหน้า) ดู CLAUDE.md Dev Standard #24
      provider: { data_collection: "deny" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: "high" },
            },
            { type: "text", text: ID_CARD_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new BadRequestError(
      `ตรวจสอบบัตรประชาชนไม่สำเร็จ (OpenRouter ตอบกลับ ${response.status})`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message.content ?? "";

  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new BadRequestError("อ่านข้อมูลบัตรประชาชนไม่สำเร็จ กรุณาลองใหม่");

  return JSON.parse(json) as IdCardAnalysis;
}
