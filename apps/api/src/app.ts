import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
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
  .use(staticPlugin({ assets: UPLOAD_ROOT, prefix: "/uploads" }))
  .use(healthRoutes)
  .use(authRoutes)
  .use(categoryRoutes)
  .use(userRoutes)
  .use(adminRoutes)
  .use(roleRoutes)
  .use(rolePermissionRoutes)
  .use(productRoutes)
  .use(meRoutes);
