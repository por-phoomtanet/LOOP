import { Elysia } from "elysia";
import { z } from "zod";
import * as userController from "../controllers/user.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const paymentProfileSchema = z.object({
  legalName: z.string().min(1),
});

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .use(authMacro)
  .post(
    "/:id/profile-image",
    ({ params, body, user }) => {
      const file = (body as { file?: unknown } | undefined)?.file;
      return userController.uploadProfileImage(
        user.userId,
        Number(params.id),
        file instanceof File ? file : undefined,
      );
    },
    { auth: true },
  )
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
  )
  .get(
    "/:id/payment-profile",
    ({ params, user }) => userController.getPaymentProfile(user.userId, Number(params.id)),
    { auth: true },
  )
  .patch(
    "/:id/payment-profile",
    ({ params, body, user }) =>
      userController.updatePaymentProfile(user.userId, Number(params.id), body),
    { ...validate({ body: paymentProfileSchema }), auth: true },
  )
  .post(
    "/:id/payment-qr",
    ({ params, body, user }) => {
      const file = (body as { file?: unknown } | undefined)?.file;
      return userController.uploadPromptPayQr(
        user.userId,
        Number(params.id),
        file instanceof File ? file : undefined,
      );
    },
    { auth: true },
  );
