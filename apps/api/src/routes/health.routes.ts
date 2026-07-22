import { Elysia } from "elysia";
import { health } from "../controllers/health.controller";

export const healthRoutes = new Elysia({ prefix: "/api/health" }).get("/", () => health());
