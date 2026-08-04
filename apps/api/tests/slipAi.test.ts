import { describe, it, expect, afterEach } from "bun:test";
import { analyzeSlip } from "../src/services/payment/slipAi";

const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENROUTER_API_KEY;
const originalModel = process.env.OPENROUTER_MODEL;
const fakeFile = new File(["fake"], "slip.jpg", { type: "image/jpeg" });

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

describe("analyzeSlip", () => {
  it("throws a clear error when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(analyzeSlip(fakeFile)).rejects.toThrow("OpenRouter");
  });

  it("parses the JSON slip analysis from a well-formed response", async () => {
    mockOpenRouter(
      JSON.stringify({
        amount: 500,
        date: "2026-08-01",
        time: "10:30",
        reference: "REF123",
        senderName: "สมชาย ใจดี",
        receiverName: "ภูมิธเนศ อินทยุง",
        bank: "SCB",
        valid: true,
      }),
    );

    const result = await analyzeSlip(fakeFile);
    expect(result.amount).toBe(500);
    expect(result.reference).toBe("REF123");
    expect(result.valid).toBe(true);
  });

  it("extracts JSON even when the model wraps it with extra text", async () => {
    mockOpenRouter('Here is the result:\n{"amount": 100, "valid": false}\nThanks!');
    const result = await analyzeSlip(fakeFile);
    expect(result.amount).toBe(100);
    expect(result.valid).toBe(false);
  });

  it("throws when the model does not return any JSON", async () => {
    mockOpenRouter("I cannot analyze this image.");
    await expect(analyzeSlip(fakeFile)).rejects.toThrow();
  });

  it("throws when OpenRouter responds with a non-2xx status", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test-model";
    globalThis.fetch = (async () =>
      new Response("bad request", { status: 400 })) as unknown as typeof fetch;

    await expect(analyzeSlip(fakeFile)).rejects.toThrow();
  });
});
