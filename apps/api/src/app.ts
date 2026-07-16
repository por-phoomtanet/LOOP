import path from "node:path";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";
import { rolePermissionRouter } from "./routes/rolePermission.routes";
import { userRouter } from "./routes/user.routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/role-permissions", rolePermissionRouter);

app.use(errorHandler);
