import { describe, it, expect, spyOn, afterEach } from "bun:test";
import request from "supertest";
import { baseUrl } from "./testApp";
import { registerUser, uniqueEmail } from "./helpers";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
});

function mockOpenRouter(content: Record<string, unknown>) {
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.OPENROUTER_MODEL = "test-model";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
      status: 200,
    })) as unknown as typeof fetch;
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("POST /api/auth/register", () => {
  it("creates a new user and returns a token", async () => {
    const email = uniqueEmail("reg");
    const res = await request(baseUrl).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "Test User",
      email,
      phone: "0812345678",
      password: "password123",
      pdpaConsent: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects registration without pdpa consent with 400", async () => {
    const res = await request(baseUrl)
      .post("/api/auth/register")
      .send({
        accountType: "INDIVIDUAL",
        name: "Test User",
        email: uniqueEmail("nopdpa"),
        phone: "0812345678",
        password: "password123",
      });

    expect(res.status).toBe(400);
  });

  it("rejects duplicate email with 409", async () => {
    const email = uniqueEmail("dup");
    await request(baseUrl).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "A",
      email,
      phone: "0812345678",
      password: "password123",
      pdpaConsent: true,
    });

    const res = await request(baseUrl).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "B",
      email,
      phone: "0899999999",
      password: "password123",
      pdpaConsent: true,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("อีเมลนี้ถูกใช้แล้ว");
  });

  it("rejects invalid body with 400", async () => {
    const res = await request(baseUrl).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "",
      email: "not-an-email",
      phone: "",
      password: "short",
    });

    expect(res.status).toBe(400);
  });

  it("stores confirmed id card ocr fields when provided", async () => {
    const email = uniqueEmail("regocr");
    const res = await request(baseUrl)
      .post("/api/auth/register")
      .send({
        accountType: "INDIVIDUAL",
        name: "Test User",
        email,
        phone: "0812345678",
        password: "password123",
        pdpaConsent: true,
        idCardNumber: `1329900988${Date.now() % 1000}`,
        idCardNameTh: "นาย ภูมิธเนศ อินทยุง",
        idCardNameEn: "Mr. Phoomtanet Intayung",
        idCardAddress: "15 หมู่ที่ 7 ต.ไพล อ.ปราสาท จ.สุรินทร์",
        idCardDob: "2000-07-20",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
  });

  it("registers fine without any id card ocr fields (backward compatible)", async () => {
    const email = uniqueEmail("regnoocr");
    const res = await request(baseUrl).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "Test User",
      email,
      phone: "0812345678",
      password: "password123",
      pdpaConsent: true,
    });

    expect(res.status).toBe(201);
  });

  it("rejects a duplicate id card number with 409", async () => {
    const sharedIdCardNumber = `1111111111${Date.now() % 1000}`;

    const first = await request(baseUrl)
      .post("/api/auth/register")
      .send({
        accountType: "INDIVIDUAL",
        name: "A",
        email: uniqueEmail("iddup1"),
        phone: "0812345678",
        password: "password123",
        pdpaConsent: true,
        idCardNumber: sharedIdCardNumber,
      });
    expect(first.status).toBe(201);

    const second = await request(baseUrl)
      .post("/api/auth/register")
      .send({
        accountType: "INDIVIDUAL",
        name: "B",
        email: uniqueEmail("iddup2"),
        phone: "0899999999",
        password: "password123",
        pdpaConsent: true,
        idCardNumber: sharedIdCardNumber,
      });

    expect(second.status).toBe(409);
    expect(second.body.error).toBe("บัตรประชาชนนี้ถูกใช้สมัครสมาชิกไปแล้ว");
  });
});

describe("POST /api/ocr/id-card", () => {
  it("extracts id card fields without requiring authentication", async () => {
    mockOpenRouter({
      idNumber: "1329900988871",
      nameTh: "นาย ภูมิธเนศ อินทยุง",
      nameEn: "Mr. Phoomtanet Intayung",
      address: "15 หมู่ที่ 7 ต.ไพล อ.ปราสาท จ.สุรินทร์",
      dob: "2000-07-20",
      valid: true,
    });

    const res = await request(baseUrl)
      .post("/api/ocr/id-card")
      .attach("file", TINY_PNG, { filename: "id.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.idNumber).toBe("1329900988871");
    expect(res.body.data.nameTh).toBe("นาย ภูมิธเนศ อินทยุง");
  });

  it("rejects a request with no file attached", async () => {
    const res = await request(baseUrl).post("/api/ocr/id-card");
    expect(res.status).toBe(400);
  });

  it("does not persist anything to the database", async () => {
    const idCardNumber = `9999999999${Date.now() % 1000}`;
    mockOpenRouter({ idNumber: idCardNumber, valid: true });

    const res = await request(baseUrl)
      .post("/api/ocr/id-card")
      .attach("file", TINY_PNG, { filename: "id.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    // ถ้า endpoint นี้ persist โดยไม่ตั้งใจ เลขบัตรนี้จะชนกับ unique constraint ตอน register จริง
    const followUp = await request(baseUrl)
      .post("/api/auth/register")
      .send({
        accountType: "INDIVIDUAL",
        name: "Test User",
        email: uniqueEmail("ocrnopersist"),
        phone: "0812345678",
        password: "password123",
        pdpaConsent: true,
        idCardNumber,
      });
    expect(followUp.status).toBe(201);
  });
});

describe("OTP request/verify", () => {
  it("requires authentication", async () => {
    const res = await request(baseUrl)
      .post("/api/auth/register/otp/request")
      .send({ method: "email" });
    expect(res.status).toBe(401);
  });

  it("auto-activates the account once the correct code is verified", async () => {
    const { token } = await registerUser("otp");

    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const otpRes = await request(baseUrl)
      .post("/api/auth/register/otp/request")
      .set("Authorization", `Bearer ${token}`)
      .send({ method: "email" });
    expect(otpRes.status).toBe(200);

    const logged = logSpy.mock.calls.map((c) => c.join(" ")).find((l) => l.includes("[MOCK OTP]"));
    logSpy.mockRestore();
    const code = logged?.match(/รหัส (\d{6})/)?.[1];
    expect(code).toBeDefined();

    const wrongRes = await request(baseUrl)
      .post("/api/auth/register/otp/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "000000" });
    expect(wrongRes.status).toBe(400);

    const verifyRes = await request(baseUrl)
      .post("/api/auth/register/otp/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in the seeded admin user", async () => {
    const res = await request(baseUrl)
      .post("/api/auth/login")
      .send({ email: "admin@loop.dev", password: "Admin123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("rejects wrong password with 401", async () => {
    const res = await request(baseUrl)
      .post("/api/auth/login")
      .send({ email: "admin@loop.dev", password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});
