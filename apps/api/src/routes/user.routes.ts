import { Elysia } from "elysia";
import * as userController from "../controllers/user.controller";
import { authMacro } from "../plugins/auth";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .use(authMacro)
  .post(
    "/:id/id-card",
    ({ params, body, user }) => {
      const file = (body as { file?: unknown } | undefined)?.file;
      return userController.uploadIdCard(
        user.userId,
        Number(params.id),
        file instanceof File ? file : undefined,
      );
    },
    { auth: true },
  )
  .post(
    "/:id/id-card/ocr-mock",
    ({ params, user }) => userController.ocrMock(user.userId, Number(params.id)),
    { auth: true },
  )
  .post(
    "/:id/face-verify",
    ({ params, user }) => userController.faceVerify(user.userId, Number(params.id)),
    { auth: true },
  );
