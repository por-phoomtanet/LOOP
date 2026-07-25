import { join, normalize, sep } from "node:path";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { handleError } from "./plugins/errorHandling";
import { UPLOAD_ROOT } from "./plugins/upload";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { categoryRoutes } from "./routes/category.routes";
import { healthRoutes } from "./routes/health.routes";
import { meRoutes } from "./routes/me.routes";
import { productRoutes } from "./routes/product.routes";
import { roleRoutes } from "./routes/role.routes";
import { rolePermissionRoutes } from "./routes/rolePermission.routes";
import { userRoutes } from "./routes/user.routes";

export const app = new Elysia()
  .onError(({ code, error, set }) => handleError(code, error, set))
  .use(cors())
  // เสิร์ฟไฟล์อัปโหลดแบบอ่านจาก disk ต่อ request (แทน @elysiajs/static ที่ scan โฟลเดอร์ตอน startup
  // ครั้งเดียว ทำให้ไฟล์ที่อัปโหลดหลัง server รันแล้วโดน 404) + กัน path traversal
  .get("/uploads/*", async ({ params, set }) => {
    const rel = normalize(params["*"] ?? "").replace(/^([.][.][/\\])+/, "");
    const filePath = join(UPLOAD_ROOT, rel);
    if (filePath !== UPLOAD_ROOT && !filePath.startsWith(UPLOAD_ROOT + sep)) {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      set.status = 404;
      return { error: "Not found" };
    }
    return file;
  })
  .use(healthRoutes)
  .use(authRoutes)
  .use(categoryRoutes)
  .use(userRoutes)
  .use(adminRoutes)
  .use(roleRoutes)
  .use(rolePermissionRoutes)
  .use(productRoutes)
  .use(meRoutes);
