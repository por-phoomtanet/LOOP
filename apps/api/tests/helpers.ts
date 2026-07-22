import request from "supertest";
import { baseUrl } from "./testApp";

export function uniqueEmail(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`;
}

export async function registerUser(prefix: string) {
  const email = uniqueEmail(prefix);
  const res = await request(baseUrl).post("/api/auth/register").send({
    accountType: "INDIVIDUAL",
    name: "Test User",
    email,
    phone: "0812345678",
    password: "password123",
  });
  return { email, token: res.body.data.token as string, userId: res.body.data.user.id as number };
}
