import type { ZodTypeAny } from "zod";

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

type ValidatableCtx = { body: unknown; query: unknown; params: unknown };

// แทน middleware/validate.ts → hook object spread เข้า route options ของ Elysia
// เก็บ pattern เดิม (Zod .parse() throw ZodError → onError) เพื่อไม่ต้องแก้ schema ที่มีอยู่
export function validate(schemas: Schemas) {
  return {
    beforeHandle(ctx: ValidatableCtx) {
      if (schemas.body) ctx.body = schemas.body.parse(ctx.body);
      if (schemas.query) ctx.query = schemas.query.parse(ctx.query);
      if (schemas.params) ctx.params = schemas.params.parse(ctx.params);
    },
  };
}
