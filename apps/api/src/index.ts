import { validateEnv } from "./utils/env";

// ต้อง validate env ก่อน import ./app (ซึ่ง import @loop/db → PrismaClient ที่ต้องใช้ DATABASE_URL)
// ใช้ dynamic import() หลัง validateEnv เพราะ static import ถูก hoist ขึ้นบนสุดเสมอ
// (dev/start script สั่ง `bun --env-file=../../.env` — โหลด .env จาก root ของ repo
// เดียว ไม่มี apps/api/.env ของตัวเองแล้ว จึงไม่ต้องใช้ dotenv)
validateEnv();

const { app } = await import("./app");

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT);
console.log(`LOOP API listening on port ${app.server?.port ?? PORT}`);
