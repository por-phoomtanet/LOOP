import request from "supertest";
import { app } from "../src/app";
import { registerUser } from "./helpers";

async function loginAdmin() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@loop.dev", password: "Admin123!" });
  return res.body.data.token as string;
}

describe("GET /api/admin/users", () => {
  it("rejects non-admin users with 403", async () => {
    const { token } = await registerUser("nonadmin");
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns the user list for admin", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/admin/users/:id/status", () => {
  it("lets admin suspend and unsuspend a user at any time (not gated by PENDING)", async () => {
    const adminToken = await loginAdmin();
    const { userId } = await registerUser("moderation");

    const suspend = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "REJECTED" });
    expect(suspend.status).toBe(200);
    expect(suspend.body.data.verificationStatus).toBe("REJECTED");

    const unsuspend = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED" });
    expect(unsuspend.status).toBe(200);
    expect(unsuspend.body.data.verificationStatus).toBe("APPROVED");
  });

  it("rejects an invalid status value with 400", async () => {
    const adminToken = await loginAdmin();
    const { userId } = await registerUser("badstatus");

    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "BOGUS" });
    expect(res.status).toBe(400);
  });

  it("rejects non-admin callers with 403", async () => {
    const { token, userId } = await registerUser("selfmod");
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "REJECTED" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/role-permissions/:role", () => {
  it("returns full permissions for admin role", async () => {
    const adminToken = await loginAdmin();
    const res = await request(app)
      .get("/api/role-permissions/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const usersMenu = res.body.data.find((p: { menuKey: string }) => p.menuKey === "users");
    expect(usersMenu).toMatchObject({
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
  });
});
