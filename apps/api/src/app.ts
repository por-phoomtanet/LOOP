import path from "node:path";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { categoryRouter } from "./routes/category.routes";
import { healthRouter } from "./routes/health.routes";
import { meRouter } from "./routes/me.routes";
import { productRouter } from "./routes/product.routes";
import { roleRouter } from "./routes/role.routes";
import { rolePermissionRouter } from "./routes/rolePermission.routes";
import { userRouter } from "./routes/user.routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/roles", roleRouter);
app.use("/api/role-permissions", rolePermissionRouter);
app.use("/api/products", productRouter);
app.use("/api/me", meRouter);

app.use(errorHandler);
