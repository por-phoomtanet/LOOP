import { describe, it, expect, afterEach } from "bun:test";
import { analyzeIdCard } from "../src/services/kyc/idCardAi";

const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENROUTER_API_KEY;
const originalModel = process.env.OPENROUTER_MODEL;
const fakeFile = new File(["fake"], "id-card.jpg", { type: "image/jpeg" });

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENROUTER_MODEL;
  else process.env.OPENROUTER_MODEL = originalModel;
});

function mockOpenRouter(content: string) {
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.OPENROUTER_MODEL = "test-model";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
    })) as unknown as typeof fetch;
}

describe("analyzeIdCard", () => {
  it("throws a clear error when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(analyzeIdCard(fakeFile)).rejects.toThrow("OpenRouter");
  });

  it("parses the JSON id card analysis from a well-formed response", async () => {
    mockOpenRouter(
      JSON.stringify({
        idNumber: "1329900988871",
        nameTh: "นาย ภูมิธเนศ อินทยุง",
        nameEn: "Mr. Phoomtanet Intayung",
        address: "15 หมู่ที่ 7 ต.ไพล อ.ปราสาท จ.สุรินทร์",
        dob: "2000-07-20",
        valid: true,
      }),
    );

    const result = await analyzeIdCard(fakeFile);
    expect(result.idNumber).toBe("1329900988871");
    expect(result.nameTh).toBe("นาย ภูมิธเนศ อินทยุง");
    expect(result.valid).toBe(true);
  });

  it("extracts JSON even when the model wraps it with extra text", async () => {
    mockOpenRouter('Here is the result:\n{"idNumber": "1329900988871", "valid": true}\nThanks!');
    const result = await analyzeIdCard(fakeFile);
    expect(result.idNumber).toBe("1329900988871");
  });

  it("strips spaces and dashes from the id number", async () => {
    mockOpenRouter(JSON.stringify({ idNumber: "1 3299 00988 87 1", valid: true }));
    const result = await analyzeIdCard(fakeFile);
    expect(result.idNumber).toBe("1329900988871");
  });

  it("treats an id number that is not 13 digits as unreadable", async () => {
    mockOpenRouter(JSON.stringify({ idNumber: "132990098", valid: true }));
    const result = await analyzeIdCard(fakeFile);
    expect(result.idNumber).toBeNull();
    expect(result.missingFields).toContain("idNumber");
  });

  it("treats placeholder values the model returns for unreadable text as missing", async () => {
    mockOpenRouter(
      JSON.stringify({
        idNumber: "1329900988871",
        nameTh: "ภูมิธเนศ อินทยุง",
        nameEn: "N/A",
        address: "ไม่ชัดเจน",
        dob: "2000-07-20",
        valid: true,
      }),
    );

    const result = await analyzeIdCard(fakeFile);
    expect(result.address).toBeNull();
    expect(result.nameEn).toBeNull();
    expect(result.missingFields).toEqual(["nameEn", "address"]);
    // ฟิลด์ที่อ่านได้ต้องไม่ถูกกระทบ
    expect(result.nameTh).toBe("ภูมิธเนศ อินทยุง");
  });

  it("treats values containing ? (the prompt's unreadable marker) as missing", async () => {
    mockOpenRouter(JSON.stringify({ nameTh: "ภูมิธ?เนศ อินท?ุง", valid: true }));
    const result = await analyzeIdCard(fakeFile);
    expect(result.nameTh).toBeNull();
    expect(result.missingFields).toContain("nameTh");
  });

  it("keeps the address but reports name/id missing when only the lower half is visible", async () => {
    // เคสจริง: ผู้ใช้ครอปมาแค่ครึ่งล่างของบัตร เห็นที่อยู่ + ลายเซ็นเจ้าพนักงานออกบัตร
    // แต่ไม่เห็นแถวชื่อ/เลขบัตรที่อยู่ครึ่งบน — prompt สั่งให้ตอบ null ไม่ใช่หยิบชื่อ
    // เจ้าพนักงานออกบัตร ("นายธนาคม จงจิระ") มาใส่แทน
    mockOpenRouter(
      JSON.stringify({
        idNumber: null,
        nameTh: null,
        nameEn: null,
        address: "15 หมู่ที่ 7 ต.ไพล อ.ปราสาท จ.สุรินทร์",
        dob: "2000-07-20",
        valid: true,
      }),
    );

    const result = await analyzeIdCard(fakeFile);
    expect(result.address).toBe("15 หมู่ที่ 7 ต.ไพล อ.ปราสาท จ.สุรินทร์");
    expect(result.dob).toBe("2000-07-20");
    expect(result.missingFields).toEqual(["idNumber", "nameTh", "nameEn"]);
  });

  it("reports every field as missing when the model returns an empty object", async () => {
    mockOpenRouter("{}");
    const result = await analyzeIdCard(fakeFile);
    expect(result.missingFields).toEqual(["idNumber", "nameTh", "nameEn", "address", "dob"]);
    expect(result.valid).toBe(false);
  });

  it("throws when the model does not return any JSON", async () => {
    mockOpenRouter("I cannot analyze this image.");
    await expect(analyzeIdCard(fakeFile)).rejects.toThrow();
  });

  it("throws when OpenRouter responds with a non-2xx status", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test-model";
    globalThis.fetch = (async () =>
      new Response("bad request", { status: 400 })) as unknown as typeof fetch;

    await expect(analyzeIdCard(fakeFile)).rejects.toThrow();
  });
});
