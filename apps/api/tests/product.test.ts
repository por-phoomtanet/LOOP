import { describe, it, expect } from "bun:test";
import { prisma } from "@loop/db";
import request from "supertest";
import { baseUrl } from "./testApp";
import { registerUser } from "./helpers";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function activeCategoryId() {
  const res = await request(baseUrl).get("/api/categories");
  return res.body.data[0].id as number;
}

async function createProduct(token: string, categoryId: number, overrides: object = {}) {
  const res = await request(baseUrl)
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "กล้องฟิล์ม Canon AE-1",
      description: "สภาพดี ใช้งานปกติ",
      categoryId,
      pricePerDay: 150,
      location: "กรุงเทพฯ",
      ...overrides,
    });
  return res;
}

describe("POST /api/products", () => {
  it("creates a listing forced to UNDER_REVIEW for the authenticated owner", async () => {
    const { token } = await registerUser("listcreate");
    const categoryId = await activeCategoryId();

    const res = await createProduct(token, categoryId);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("UNDER_REVIEW");
    expect(res.body.data.ownerId).toBeDefined();
  });

  it("requires authentication", async () => {
    const categoryId = await activeCategoryId();
    const res = await request(baseUrl).post("/api/products").send({
      title: "x",
      description: "x",
      categoryId,
      pricePerDay: 10,
      location: "x",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a category id that does not exist", async () => {
    const { token } = await registerUser("badcat");
    const res = await createProduct(token, 999999);
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/products/:id", () => {
  it("lets the owner update their listing", async () => {
    const { token } = await registerUser("editowner");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .put(`/api/products/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "ชื่อใหม่" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("ชื่อใหม่");
  });

  it("rejects editing another user's listing with 403", async () => {
    const { token } = await registerUser("editvictim");
    const { token: attackerToken } = await registerUser("editattacker");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .put(`/api/products/${created.body.data.id}`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ title: "แฮ็ก" });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/products/:id/status", () => {
  it("blocks pause/resume while still UNDER_REVIEW", async () => {
    const { token } = await registerUser("pauseunreviewed");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .patch(`/api/products/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "PAUSED" });

    expect(res.status).toBe(400);
  });

  it("lets the owner pause and resume a listing that has been approved", async () => {
    const { token } = await registerUser("pauseresume");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);
    const id = created.body.data.id;

    // no admin-approve-product endpoint exists yet (Admin > Products is read-only) —
    // simulate the post-approval state directly so pause/resume can be exercised
    await prisma.product.update({ where: { id }, data: { status: "ACTIVE" } });

    const paused = await request(baseUrl)
      .patch(`/api/products/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "PAUSED" });
    expect(paused.status).toBe(200);
    expect(paused.body.data.status).toBe("PAUSED");

    const resumed = await request(baseUrl)
      .patch(`/api/products/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "ACTIVE" });
    expect(resumed.status).toBe(200);
    expect(resumed.body.data.status).toBe("ACTIVE");
  });

  it("rejects status changes from another user with 403", async () => {
    const { token } = await registerUser("statusvictim");
    const { token: attackerToken } = await registerUser("statusattacker");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);
    await prisma.product.update({
      where: { id: created.body.data.id },
      data: { status: "ACTIVE" },
    });

    const res = await request(baseUrl)
      .patch(`/api/products/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ status: "PAUSED" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/products/:id", () => {
  it("soft deletes and removes the listing from /api/me/listings", async () => {
    const { token } = await registerUser("deleteowner");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .delete(`/api/products/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const listings = await request(baseUrl)
      .get("/api/me/listings")
      .set("Authorization", `Bearer ${token}`);
    expect(
      listings.body.data.find((p: { id: number }) => p.id === created.body.data.id),
    ).toBeUndefined();
  });

  it("rejects deleting another user's listing with 403", async () => {
    const { token } = await registerUser("deletevictim");
    const { token: attackerToken } = await registerUser("deleteattacker");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .delete(`/api/products/${created.body.data.id}`)
      .set("Authorization", `Bearer ${attackerToken}`);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/products/:id/images", () => {
  it("uploads images for the owner with incrementing sortOrder", async () => {
    const { token } = await registerUser("imgowner");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .post(`/api/products/${created.body.data.id}/images`)
      .set("Authorization", `Bearer ${token}`)
      .attach("files", TINY_PNG, { filename: "a.png", contentType: "image/png" })
      .attach("files", TINY_PNG, { filename: "b.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].sortOrder).toBe(0);
    expect(res.body.data[1].sortOrder).toBe(1);
    expect(res.body.data[0].url).toMatch(/^\/uploads\/products\//);
  });

  it("rejects a non-image file with 400", async () => {
    const { token } = await registerUser("imgbad");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .post(`/api/products/${created.body.data.id}/images`)
      .set("Authorization", `Bearer ${token}`)
      .attach("files", Buffer.from("not an image"), {
        filename: "a.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  it("rejects uploading images to another user's listing with 403", async () => {
    const { token } = await registerUser("imgvictim");
    const { token: attackerToken } = await registerUser("imgattacker");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .post(`/api/products/${created.body.data.id}/images`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .attach("files", TINY_PNG, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(403);
  });
});

describe("pickup options", () => {
  it("lets the owner add and remove a pickup option", async () => {
    const { token } = await registerUser("pickupowner");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);
    const id = created.body.data.id;

    const added = await request(baseUrl)
      .post(`/api/products/${id}/pickup-options`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "BTS อโศก" });
    expect(added.status).toBe(201);
    expect(added.body.data.label).toBe("BTS อโศก");

    const removed = await request(baseUrl)
      .delete(`/api/products/${id}/pickup-options/${added.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });

  it("rejects adding a pickup option to another user's listing with 403", async () => {
    const { token } = await registerUser("pickupvictim");
    const { token: attackerToken } = await registerUser("pickupattacker");
    const categoryId = await activeCategoryId();
    const created = await createProduct(token, categoryId);

    const res = await request(baseUrl)
      .post(`/api/products/${created.body.data.id}/pickup-options`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ label: "แฮ็ก" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/me/listings", () => {
  it("returns only the authenticated user's own listings across all statuses", async () => {
    const { token } = await registerUser("mylistings");
    const { token: otherToken } = await registerUser("otherlistings");
    const categoryId = await activeCategoryId();

    const mine = await createProduct(token, categoryId, { title: "ของฉัน" });
    await createProduct(otherToken, categoryId, { title: "ของคนอื่น" });

    const res = await request(baseUrl)
      .get("/api/me/listings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((p: { id: number }) => p.id !== undefined)).toBe(true);
    const titles = res.body.data.map((p: { title: string }) => p.title);
    expect(titles).toContain("ของฉัน");
    expect(titles).not.toContain("ของคนอื่น");
    expect(res.body.data.find((p: { id: number }) => p.id === mine.body.data.id)).toBeDefined();
  });

  it("requires authentication", async () => {
    const res = await request(baseUrl).get("/api/me/listings");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/products (pagination)", () => {
  it("returns a paginated envelope with total/page/pageSize and respects pageSize", async () => {
    const res = await request(baseUrl).get("/api/products?page=1&pageSize=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(5);
    expect(typeof res.body.total).toBe("number");
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it("defaults page/pageSize when not provided", async () => {
    const res = await request(baseUrl).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(24);
    expect(res.body.data.length).toBeLessThanOrEqual(24);
  });

  it("rejects an invalid pageSize with 400", async () => {
    const res = await request(baseUrl).get("/api/products?pageSize=abc");
    expect(res.status).toBe(400);
  });
});
