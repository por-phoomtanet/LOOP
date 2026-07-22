import { describe, it, expect } from "bun:test";
import request from "supertest";
import { baseUrl } from "./testApp";
import { registerUser } from "./helpers";

async function loginAdmin() {
  const res = await request(baseUrl)
    .post("/api/auth/login")
    .send({ email: "admin@loop.dev", password: "Admin123!" });
  return res.body.data.token as string;
}

function uniqueName(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

describe("GET /api/categories", () => {
  it("is public and returns only active categories by default", async () => {
    const res = await request(baseUrl).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((c: { isActive: boolean }) => c.isActive)).toBe(true);
  });
});

describe("POST /api/categories", () => {
  it("creates a category and auto-slugifies the name when slug is omitted", async () => {
    const adminToken = await loginAdmin();
    const name = uniqueName("Test Category ");
    const res = await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.slug).toBe(
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-"),
    );
  });

  it("rejects a duplicate slug with 409", async () => {
    const adminToken = await loginAdmin();
    const slug = uniqueName("dupslug");
    await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "First", slug });

    const res = await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Second", slug });

    expect(res.status).toBe(409);
  });

  it("rejects non-admin with 403 and unauthenticated with 401", async () => {
    const { token } = await registerUser("catcreate");
    const nonAdmin = await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X" });
    expect(nonAdmin.status).toBe(403);

    const noAuth = await request(baseUrl).post("/api/categories").send({ name: "X" });
    expect(noAuth.status).toBe(401);
  });
});

describe("PATCH /api/categories/:id/status and DELETE", () => {
  it("toggles isActive and excludes inactive categories from the default list", async () => {
    const adminToken = await loginAdmin();
    const created = await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: uniqueName("toggle") });
    const id = created.body.data.id;

    const toggled = await request(baseUrl)
      .patch(`/api/categories/${id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(toggled.status).toBe(200);
    expect(toggled.body.data.isActive).toBe(false);

    const activeList = await request(baseUrl).get("/api/categories");
    expect(activeList.body.data.find((c: { id: number }) => c.id === id)).toBeUndefined();

    const allList = await request(baseUrl).get("/api/categories?status=all");
    expect(allList.body.data.find((c: { id: number }) => c.id === id)).toBeDefined();
  });

  it("deletes a category with no products, and soft-deletes it", async () => {
    const adminToken = await loginAdmin();
    const created = await request(baseUrl)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: uniqueName("delete") });
    const id = created.body.data.id;

    const deleted = await request(baseUrl)
      .delete(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);

    const allList = await request(baseUrl).get("/api/categories?status=all");
    expect(allList.body.data.find((c: { id: number }) => c.id === id)).toBeUndefined();
  });
});

describe("GET /api/admin/products", () => {
  it("rejects non-admin with 403", async () => {
    const { token } = await registerUser("prodlist");
    const res = await request(baseUrl)
      .get("/api/admin/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns a list for admin (empty until Phase 5 listing flow exists)", async () => {
    const adminToken = await loginAdmin();
    const res = await request(baseUrl)
      .get("/api/admin/products")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
