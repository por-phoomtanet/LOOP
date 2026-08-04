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
    mockOpenRouter('Here is the result:\n{"idNumber": "123", "valid": true}\nThanks!');
    const result = await analyzeIdCard(fakeFile);
    expect(result.idNumber).toBe("123");
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
