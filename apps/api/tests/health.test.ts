import { describe, it, expect } from "bun:test";
import request from "supertest";
import { baseUrl } from "./testApp";

describe("GET /api/health", () => {
  it("returns status ok with db and uptime", async () => {
    const res = await request(baseUrl).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("uptime");
  });
});
