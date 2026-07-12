import { prisma } from "@loop/db";

const startedAt = Date.now();

export async function getHealth() {
  let db: "connected" | "disconnected" = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "connected";
  } catch {
    db = "disconnected";
  }

  return {
    status: "ok" as const,
    db,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  };
}
