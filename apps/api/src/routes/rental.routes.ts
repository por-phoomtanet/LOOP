import { Elysia } from "elysia";
import { z } from "zod";
import * as rentalController from "../controllers/rental.controller";
import { authMacro } from "../plugins/auth";
import { validate } from "../plugins/validate";

const createRentalSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const rentalRoutes = new Elysia()
  .use(authMacro)
  .post(
    "/api/products/:id/rentals",
    ({ params, body, user, set }) => {
      set.status = 201;
      return rentalController.createRental(user.userId, Number(params.id), body);
    },
    { ...validate({ body: createRentalSchema }), auth: true },
  )
  .get(
    "/api/rentals/:id/payment",
    ({ params, user }) => rentalController.getPaymentInfo(user.userId, Number(params.id)),
    { auth: true },
  )
  .post(
    "/api/rentals/:id/slip",
    ({ params, body, user }) => {
      const file = (body as { file?: unknown } | undefined)?.file;
      return rentalController.submitSlip(
        user.userId,
        Number(params.id),
        file instanceof File ? file : undefined,
      );
    },
    { auth: true },
  );
