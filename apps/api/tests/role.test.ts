import request from "supertest";
import { app } from "../src/app";
import { registerUser } from "./helpers";

async function loginAdmin() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@loop.dev", password: "Admin123!" });
  return res.body.data.token as string;
}

function uniqueRoleName(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

describe("GET /api/roles", () => {
  it("rejects non-admin with 403", async () => {
    const { token } = await registerUser("rolelist");
    const res = await request(app).get("/api/roles").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns roles with user counts for admin", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app).get("/api/roles").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const adminRole = res.body.data.find((r: { name: string }) => r.name === "admin");
    expect(adminRole).toMatchObject({ name: "admin" });
    expect(typeof adminRole.userCount).toBe("number");
  });
});

describe("POST /api/roles", () => {
  it("creates a new role", async () => {
    const adminToken = await loginAdmin();
    const name = uniqueRoleName("role");
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name, label: "ทดสอบ" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
  });

  it("rejects duplicate role name with 409", async () => {
    const adminToken = await loginAdmin();
    const name = uniqueRoleName("dup");
    await request(app)
      .post("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name, label: "A" });

    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name, label: "B" });

    expect(res.status).toBe(409);
  });
});

describe("PUT and DELETE /api/roles/:id", () => {
  it("updates a role and deletes it when unused", async () => {
    const adminToken = await loginAdmin();
    const name = uniqueRoleName("temp");
    const created = await request(app)
      .post("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name, label: "เดิม" });
    const roleId = created.body.data.id;

    const updated = await request(app)
      .put(`/api/roles/${roleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ label: "ใหม่" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.label).toBe("ใหม่");

    // ผูก permission ให้ role นี้ก่อน เพื่อพิสูจน์ cascade delete ทำงาน
    await request(app)
      .put(`/api/role-permissions/${name}/users`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ canView: true, canCreate: false, canUpdate: false, canDelete: false });

    const deleted = await request(app)
      .delete(`/api/roles/${roleId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
  });

  it("refuses to delete a role that still has users attached", async () => {
    const adminToken = await loginAdmin();
    // role "user" always has attached users (seeded + registered in other tests)
    const res = await request(app)
      .delete("/api/roles/2")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/role-permissions/:role/:menuKey", () => {
  it("updates permission flags for a role+menu", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app)
      .put("/api/role-permissions/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ canView: true, canCreate: true, canUpdate: true, canDelete: true });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      menuKey: "users",
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
  });

  it("rejects non-admin with 403", async () => {
    const { token } = await registerUser("permedit");
    const res = await request(app)
      .put("/api/role-permissions/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ canView: true, canCreate: true, canUpdate: true, canDelete: true });
    expect(res.status).toBe(403);
  });

  it("rejects an invalid body with 400", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app)
      .put("/api/role-permissions/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ canView: "yes" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/dashboard", () => {
  it("returns real user stats and explicit nulls for unbuilt features", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.users.total).toBe("number");
    expect(typeof res.body.data.users.pending).toBe("number");
    expect(res.body.data.products).toBeNull();
    expect(res.body.data.orders).toBeNull();
  });

  it("rejects non-admin with 403", async () => {
    const { token } = await registerUser("dashboard");
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
