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

*** ส่วนที่ต้องไม่อ่านเด็ดขาด (ไม่ใช่ข้อมูลเจ้าของบัตร) ***
บนบัตรมีข้อความหลายส่วนที่ไม่ใช่ข้อมูลของเจ้าของบัตร ห้ามนำมาตอบในฟิลด์ใดๆ ทั้งสิ้น:
- ชื่อในวงเล็บใต้ลายเซ็น ที่มีคำว่า "เจ้าพนักงานออกบัตร" กำกับอยู่
  (เช่น "(นายธนาคม จงจิระ)") — นี่คือชื่อข้าราชการผู้ออกบัตร ไม่ใช่เจ้าของบัตร
- "วันออกบัตร" / "Date of Issue" และ "วันบัตรหมดอายุ" / "Date of Expiry"
- "ศาสนา", ตัวเลขส่วนสูงที่ขอบบัตร, เลขกำกับหลังบัตร, ลายน้ำ, ตราครุฑ

ชื่อเจ้าของบัตรอยู่ในแถว "ชื่อตัวและชื่อสกุล" (ไทย) และแถว "Name"/"Last name" (อังกฤษ)
ซึ่งอยู่ครึ่งบนของบัตรเท่านั้น ถ้าภาพถูกครอปจนไม่เห็นแถวนั้น → ต้องตอบ null
ห้ามใช้ชื่อเจ้าพนักงานออกบัตรมาแทนเด็ดขาด

*** สำคัญที่สุด — ห้ามแต่งข้อมูลที่มองไม่เห็น ***
ถ้าฟิลด์ไหน "มองไม่เห็นในภาพ" หรือ "เห็นแต่อ่านไม่ออก" (เช่น ภาพเบลอ มืด สะท้อนแสง
โดนบังไว้ ถูกครอปหายไป หรืออยู่นอกกรอบภาพ) ให้ตอบ null ในฟิลด์นั้นเท่านั้น
ห้ามเดา ห้ามเติมข้อความที่ "ดูสมเหตุสมผล" ห้ามใช้ความรู้ทั่วไปเรื่องที่อยู่ในประเทศไทย
มาเติมเอง ห้ามคัดลอกตัวอย่างในคำสั่งนี้มาตอบ

การตอบ null คือคำตอบที่ถูกต้องและปลอดภัยกว่าการเดา
การแต่งที่อยู่/ชื่อ/เลขบัตรที่ไม่มีในภาพถือว่าผิดร้ายแรงที่สุด

ก่อนตอบแต่ละฟิลด์ ให้ถามตัวเองว่า "ฉันเห็นข้อความนี้อยู่ในภาพจริงๆ ใช่ไหม"
ถ้าตอบไม่ได้อย่างมั่นใจ → ตอบ null

ตัวอย่างการอ่านชื่อ:
หากเห็น "ภูมิธเนศ อินทยุง"
ต้องคืน "ภูมิธเนศ อินทยุง"
ห้ามเปลี่ยนเป็นชื่อที่สะกดใกล้เคียง

ตัวอย่างกรณีมองไม่เห็น:
ถ้าในภาพเห็นแต่ชื่อกับเลขบัตร ส่วนแถวที่อยู่ถูกครอปหายไป/เบลอจนอ่านไม่ออก
→ ต้องตอบ "address": null (ห้ามแต่งที่อยู่ขึ้นมาเอง)

ตัวอย่างกรณีภาพครอปมาแค่ครึ่งล่างของบัตร:
เห็นที่อยู่ + วันออกบัตร + ลายเซ็นและชื่อ "(นายธนาคม จงจิระ) เจ้าพนักงานออกบัตร"
แต่ไม่เห็นแถวชื่อเจ้าของบัตรและเลขบัตรที่อยู่ครึ่งบน
→ ต้องตอบ "address" ตามที่อ่านได้ แต่ "idNumber": null, "nameTh": null, "nameEn": null
  (ห้ามเอา "ธนาคม จงจิระ" มาใส่เป็นชื่อเจ้าของบัตรเด็ดขาด)

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
  // ฟิลด์ที่อ่านไม่ได้/ไม่ครบ — frontend ใช้ตัดสินใจว่าจะขอให้ผู้ใช้ถ่ายรูปใหม่ไหม
  missingFields: string[];
  uncertainFields?: string[];
  confidence?: Record<string, number>;
};

// AI มักคืนคำพวกนี้แทนที่จะคืน null ตอนอ่านไม่ออก — ถือว่าเท่ากับ "ไม่มีข้อมูล"
const UNCLEAR_VALUE = /^(ไม่ชัดเจน|ไม่ชัด|ไม่พบ|อ่านไม่ออก|unclear|unknown|n\/?a|null|-{1,2}|—)$/i;

function cleanValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (UNCLEAR_VALUE.test(trimmed)) return null;
  // prompt สั่งให้ AI ใส่ "?" ตรงตัวอักษรที่อ่านไม่ออก — ถ้ามีแปลว่าอ่านได้ไม่ครบ
  if (trimmed.includes("?")) return null;
  return trimmed;
}

// เลขบัตรประชาชนไทยมี 13 หลักเสมอ — ตัดเว้นวรรค/ขีดที่ AI ใส่มา (เช่น "1 3299 00988 87 1")
// แล้วเช็คความยาว ถ้าไม่ครบ 13 หลักแปลว่าอ่านมาไม่ครบ ถือว่าใช้ไม่ได้
function cleanIdNumber(value: string | null | undefined): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const digits = cleaned.replace(/\D/g, "");
  return digits.length === 13 ? digits : null;
}

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
      // OCR = งาน extract ข้อมูลตรงๆ ไม่ใช่งานสร้างสรรค์ — ต้อง 0 เสมอ
      // ค่า default (1.0) ทำให้โมเดล "แต่ง" ที่อยู่/ชื่อที่ดูสมเหตุสมผลขึ้นมาเองตอนอ่านไม่ออก
      temperature: 0,
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

  const raw = JSON.parse(json) as Partial<IdCardAnalysis>;
  const fields = {
    idNumber: cleanIdNumber(raw.idNumber),
    nameTh: cleanValue(raw.nameTh),
    nameEn: cleanValue(raw.nameEn),
    address: cleanValue(raw.address),
    dob: cleanValue(raw.dob),
  };

  return {
    ...fields,
    valid: raw.valid === true,
    missingFields: Object.entries(fields)
      .filter(([, value]) => value === null)
      .map(([key]) => key),
  };
}
