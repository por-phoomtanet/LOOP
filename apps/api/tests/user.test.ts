import { describe, it, expect } from "bun:test";
import request from "supertest";
import { baseUrl } from "./testApp";
import { registerUser } from "./helpers";

// PNG 1x1 pixel, valid minimal image for multer's mimetype/fileFilter checks
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("POST /api/users/:id/id-card", () => {
  it("uploads an id card image for the authenticated owner", async () => {
    const { token, userId } = await registerUser("idcard");

    const res = await request(baseUrl)
      .post(`/api/users/${userId}/id-card`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", TINY_PNG, { filename: "id.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data.idCardImageUrl).toMatch(/^\/uploads\/id-cards\//);
  });

  it("rejects upload for another user's account with 403", async () => {
    const { userId: victimId } = await registerUser("victim");
    const { token: attackerToken } = await registerUser("attacker");

    const res = await request(baseUrl)
      .post(`/api/users/${victimId}/id-card`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .attach("file", TINY_PNG, { filename: "id.png", contentType: "image/png" });

    expect(res.status).toBe(403);
  });

  it("rejects request with no file attached", async () => {
    const { token, userId } = await registerUser("nofile");

    const res = await request(baseUrl)
      .post(`/api/users/${userId}/id-card`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(baseUrl)
      .post("/api/users/1/id-card")
      .attach("file", TINY_PNG, { filename: "id.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/users/:id/id-card/ocr-mock", () => {
  it("returns a fixed mock ocr result for the owner", async () => {
    const { token, userId } = await registerUser("ocr");

    const res = await request(baseUrl)
      .post(`/api/users/${userId}/id-card/ocr-mock`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      name: "SOMCHAI JAIDEE",
      idNumber: "1-2345-67890-12-3",
      dob: "1995-05-12",
      expiry: "2030-05-12",
    });
  });
});

describe("POST /api/users/:id/face-verify", () => {
  it("marks the owner's account as face-verified", async () => {
    const { token, userId } = await registerUser("face");

    const res = await request(baseUrl)
      .post(`/api/users/${userId}/face-verify`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.faceVerified).toBe(true);
  });

  it("rejects verifying another user's account with 403", async () => {
    const { userId: victimId } = await registerUser("faceVictim");
    const { token: attackerToken } = await registerUser("faceAttacker");

    const res = await request(baseUrl)
      .post(`/api/users/${victimId}/face-verify`)
      .set("Authorization", `Bearer ${attackerToken}`);

    expect(res.status).toBe(403);
  });
});
