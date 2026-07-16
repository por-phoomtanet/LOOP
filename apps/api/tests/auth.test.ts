import request from "supertest";
import { app } from "../src/app";
import { registerUser, uniqueEmail } from "./helpers";

describe("POST /api/auth/register", () => {
  it("creates a new user and returns a token", async () => {
    const email = uniqueEmail("reg");
    const res = await request(app).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "Test User",
      email,
      phone: "0812345678",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects duplicate email with 409", async () => {
    const email = uniqueEmail("dup");
    await request(app).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "A",
      email,
      phone: "0812345678",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "B",
      email,
      phone: "0899999999",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("อีเมลนี้ถูกใช้แล้ว");
  });

  it("rejects invalid body with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      accountType: "INDIVIDUAL",
      name: "",
      email: "not-an-email",
      phone: "",
      password: "short",
    });

    expect(res.status).toBe(400);
  });
});

describe("OTP request/verify", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/auth/register/otp/request").send({ method: "email" });
    expect(res.status).toBe(401);
  });

  it("auto-activates the account once the correct code is verified", async () => {
    const { token } = await registerUser("otp");

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const otpRes = await request(app)
      .post("/api/auth/register/otp/request")
      .set("Authorization", `Bearer ${token}`)
      .send({ method: "email" });
    expect(otpRes.status).toBe(200);

    const logged = logSpy.mock.calls.map((c) => c.join(" ")).find((l) => l.includes("[MOCK OTP]"));
    logSpy.mockRestore();
    const code = logged?.match(/รหัส (\d{6})/)?.[1];
    expect(code).toBeDefined();

    const wrongRes = await request(app)
      .post("/api/auth/register/otp/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "000000" });
    expect(wrongRes.status).toBe(400);

    const verifyRes = await request(app)
      .post("/api/auth/register/otp/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in the seeded admin user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loop.dev", password: "Admin123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("rejects wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@loop.dev", password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});
