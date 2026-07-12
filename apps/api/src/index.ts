import "dotenv/config";
import { validateEnv } from "./utils/env";

// ต้อง validate env ก่อน import ./app (ซึ่ง import @loop/db → PrismaClient ที่ต้องใช้ DATABASE_URL)
// ใช้ require() แทน import เพราะ import ถูก hoist ขึ้นบนสุดเสมอ ไม่ว่าจะเขียนไว้ตรงไหนในไฟล์
validateEnv();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app } = require("./app") as typeof import("./app");

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`LOOP API listening on port ${PORT}`);
});
