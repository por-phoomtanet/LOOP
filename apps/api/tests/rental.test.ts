import { describe, it, expect, afterEach } from "bun:test";
import { prisma } from "@loop/db";
import request from "supertest";
import { baseUrl } from "./testApp";
import { registerUser } from "./helpers";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
});

function mockSlipAnalysis(content: Record<string, unknown>) {
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.OPENROUTER_MODEL = "test-model";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
      status: 200,
    })) as unknown as typeof fetch;
}

async function activeCategoryId() {
  const res = await request(baseUrl).get("/api/categories");
  return res.body.data[0].id as number;
}

async function setupOwnerWithProduct(
  prefix: string,
  {
    withPaymentProfile = true,
    pricePerDay = 150,
    priceTiers,
  }: {
    withPaymentProfile?: boolean;
    pricePerDay?: number;
    priceTiers?: { days: number; price: number }[];
  } = {},
) {
  const { token: ownerToken, userId: ownerId } = await registerUser(`${prefix}owner`);

  if (withPaymentProfile) {
    await request(baseUrl)
      .patch(`/api/users/${ownerId}/payment-profile`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ legalName: "ภูมิธเนศ อินทยุง" });
    await request(baseUrl)
      .post(`/api/users/${ownerId}/payment-qr`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .attach("file", TINY_PNG, { filename: "qr.png", contentType: "image/png" });
  }

  const categoryId = await activeCategoryId();
  const productRes = await request(baseUrl)
    .post("/api/products")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      title: "จักรยานเสือภูเขา",
      description: "สภาพดี ใช้งานปกติ",
      categoryId,
      pricePerDay,
      location: "กรุงเทพฯ",
      ...(priceTiers ? { priceTiers } : {}),
    });

  return { ownerId, ownerToken, productId: productRes.body.data.id as number };
}

async function createRental(renterToken: string, productId: number, nights = 1) {
  const startDate = new Date();
  const endDate = new Date(Date.now() + nights * 24 * 60 * 60 * 1000);
  return request(baseUrl)
    .post(`/api/products/${productId}/rentals`)
    .set("Authorization", `Bearer ${renterToken}`)
    .send({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
}

describe("POST /api/products/:id/rentals", () => {
  it("creates a rental with total amount computed via resolveRentPrice", async () => {
    const { productId } = await setupOwnerWithProduct("rentalcreate");
    const { token: renterToken } = await registerUser("rentalcreaterenter");

    const res = await createRental(renterToken, productId, 1);

    expect(res.status).toBe(201);
    expect(Number(res.body.data.totalAmount)).toBe(150);
    expect(res.body.data.status).toBe("PENDING_PAYMENT");
  });

  it("computes totalAmount using the owner's custom price tiers (not just 3/7/15/30)", async () => {
    const { productId } = await setupOwnerWithProduct("rentalcustomtier", {
      priceTiers: [
        { days: 5, price: 600 },
        { days: 10, price: 1000 },
      ],
    });
    const { token: renterToken } = await registerUser("rentalcustomtierrenter");

    // 4 คืน → ปัดขึ้น tier 5 วัน (600) ไม่ใช่คิดรายวัน 4*150
    const res = await createRental(renterToken, productId, 4);
    expect(res.status).toBe(201);
    expect(Number(res.body.data.totalAmount)).toBe(600);
  });

  it("rejects renting a product that is not active", async () => {
    const { productId } = await setupOwnerWithProduct("rentalinactive");
    await prisma.product.update({ where: { id: productId }, data: { status: "PAUSED" } });
    const { token: renterToken } = await registerUser("rentalinactiverenter");

    const res = await createRental(renterToken, productId, 1);
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const { productId } = await setupOwnerWithProduct("rentalnoauth");
    const res = await request(baseUrl)
      .post(`/api/products/${productId}/rentals`)
      .send({ startDate: new Date().toISOString(), endDate: new Date().toISOString() });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/rentals/:id/payment", () => {
  it("returns the total amount and owner's promptpay qr for the renter", async () => {
    const { productId } = await setupOwnerWithProduct("paymentinfo");
    const { token: renterToken } = await registerUser("paymentinforenter");
    const created = await createRental(renterToken, productId, 1);

    const res = await request(baseUrl)
      .get(`/api/rentals/${created.body.data.id}/payment`)
      .set("Authorization", `Bearer ${renterToken}`);

    expect(res.status).toBe(200);
    expect(Number(res.body.data.totalAmount)).toBe(150);
    expect(res.body.data.promptPayQrUrl).toMatch(/^\/uploads\/promptpay-qr\//);
  });

  it("rejects another user's rental with 403", async () => {
    const { productId } = await setupOwnerWithProduct("paymentinfovictim");
    const { token: renterToken } = await registerUser("paymentinforenter2");
    const created = await createRental(renterToken, productId, 1);
    const { token: attackerToken } = await registerUser("paymentinfoattacker");

    const res = await request(baseUrl)
      .get(`/api/rentals/${created.body.data.id}/payment`)
      .set("Authorization", `Bearer ${attackerToken}`);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/rentals/:id/slip", () => {
  it("marks the rental as paid when amount and receiver name match", async () => {
    const { productId } = await setupOwnerWithProduct("slipok", { pricePerDay: 150 });
    const { token: renterToken } = await registerUser("slipokrenter");
    const created = await createRental(renterToken, productId, 1);

    mockSlipAnalysis({
      amount: 150,
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      reference: `ref-ok-${created.body.data.id}`,
      senderName: "สมชาย ใจดี",
      receiverName: "ภูมิธเนศ อินทยุง",
      bank: "SCB",
      valid: true,
    });

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(true);

    const rental = await prisma.rental.findUnique({ where: { id: created.body.data.id } });
    expect(rental?.status).toBe("PAID");
  });

  it("rejects when the amount does not match the rental total", async () => {
    const { productId } = await setupOwnerWithProduct("slipamount", { pricePerDay: 150 });
    const { token: renterToken } = await registerUser("slipamountrenter");
    const created = await createRental(renterToken, productId, 1);

    mockSlipAnalysis({
      amount: 99,
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      reference: `ref-amount-${created.body.data.id}`,
      senderName: "สมชาย ใจดี",
      receiverName: "ภูมิธเนศ อินทยุง",
      bank: "SCB",
      valid: true,
    });

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(false);
    expect(res.body.data.reason).toContain("ยอดเงินไม่ตรง");

    const rental = await prisma.rental.findUnique({ where: { id: created.body.data.id } });
    expect(rental?.status).toBe("PENDING_PAYMENT");
  });

  it("rejects when the receiver name does not match the owner's legal name", async () => {
    const { productId } = await setupOwnerWithProduct("slipname", { pricePerDay: 150 });
    const { token: renterToken } = await registerUser("slipnamerenter");
    const created = await createRental(renterToken, productId, 1);

    mockSlipAnalysis({
      amount: 150,
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      reference: `ref-name-${created.body.data.id}`,
      senderName: "สมชาย ใจดี",
      receiverName: "คนละคนกันเลย",
      bank: "SCB",
      valid: true,
    });

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(false);
    expect(res.body.data.reason).toContain("ชื่อผู้รับ");
  });

  it("rejects a slip older than 3 days", async () => {
    const { productId } = await setupOwnerWithProduct("slipold", { pricePerDay: 150 });
    const { token: renterToken } = await registerUser("sliprenterold");
    const created = await createRental(renterToken, productId, 1);

    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    mockSlipAnalysis({
      amount: 150,
      date: oldDate.toISOString().slice(0, 10),
      time: "10:00",
      reference: `ref-old-${created.body.data.id}`,
      senderName: "สมชาย ใจดี",
      receiverName: "ภูมิธเนศ อินทยุง",
      bank: "SCB",
      valid: true,
    });

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(false);
    expect(res.body.data.reason).toContain("เก่าเกินไป");
  });

  it("rejects a reused slip reference with 409", async () => {
    const { productId } = await setupOwnerWithProduct("slipdup", { pricePerDay: 150 });
    const { token: renterToken } = await registerUser("slipduprenter");
    const first = await createRental(renterToken, productId, 1);
    const second = await createRental(renterToken, productId, 1);
    const sharedReference = `ref-dup-${first.body.data.id}`;

    mockSlipAnalysis({
      amount: 150,
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      reference: sharedReference,
      senderName: "สมชาย ใจดี",
      receiverName: "ภูมิธเนศ อินทยุง",
      bank: "SCB",
      valid: true,
    });
    const firstSlip = await request(baseUrl)
      .post(`/api/rentals/${first.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });
    expect(firstSlip.status).toBe(200);
    expect(firstSlip.body.data.verified).toBe(true);

    mockSlipAnalysis({
      amount: 150,
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      reference: sharedReference,
      senderName: "สมชาย ใจดี",
      receiverName: "ภูมิธเนศ อินทยุง",
      bank: "SCB",
      valid: true,
    });
    const secondSlip = await request(baseUrl)
      .post(`/api/rentals/${second.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(secondSlip.status).toBe(409);
  });

  it("rejects when the owner has not set up a payment profile yet", async () => {
    const { productId } = await setupOwnerWithProduct("slipnoprofile", {
      withPaymentProfile: false,
    });
    const { token: renterToken } = await registerUser("slipnoprofilerenter");
    const created = await createRental(renterToken, productId, 1);

    mockSlipAnalysis({ amount: 150, valid: true, reference: "ref-noprofile" });

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${renterToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(400);
  });

  it("rejects submitting a slip for another user's rental with 403", async () => {
    const { productId } = await setupOwnerWithProduct("slipvictim");
    const { token: renterToken } = await registerUser("slipvictimrenter");
    const created = await createRental(renterToken, productId, 1);
    const { token: attackerToken } = await registerUser("slipattacker");

    const res = await request(baseUrl)
      .post(`/api/rentals/${created.body.data.id}/slip`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .attach("file", TINY_PNG, { filename: "slip.png", contentType: "image/png" });

    expect(res.status).toBe(403);
  });
});
