import { Elysia } from "elysia";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { verifyToken } from "../utils/jwt";

// แทน middleware/authenticate.ts + requireRole.ts → Elysia macro แบบ opt-in ต่อ route
//   { auth: true }        → ต้อง login (เดิม authenticate)
//   { auth: ["admin"] }   → ต้อง login + role ตรง (เดิม authenticate + requireRole("admin"))
// resolve คืน { user } เข้า context (typed) แทน req.user! non-null-assertion เดิม
export const authMacro = new Elysia({ name: "authMacro" }).macro({
  auth(roles: true | string[]) {
    return {
      resolve({ headers }: { headers: Record<string, string | undefined> }) {
        const header = headers.authorization;
        if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();

        let payload;
        try {
          payload = verifyToken(header.slice("Bearer ".length));
        } catch {
          throw new UnauthorizedError();
        }

        if (Array.isArray(roles) && !roles.includes(payload.role)) {
          throw new ForbiddenError();
        }
        return { user: { userId: payload.userId, role: payload.role } };
      },
    };
  },
});
