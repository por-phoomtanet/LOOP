import { app } from "../src/app";

// Elysia ไม่ใช่ http request-handler ที่ supertest เรียกตรงได้เหมือน Express app
// จึงต้อง listen จริงบน ephemeral port (0) แล้วให้ supertest ยิงไปที่ baseUrl
app.listen(0);

export const baseUrl = `http://localhost:${app.server!.port}`;
