import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { createImageUpload } from "../middleware/upload";

export const userRouter = Router();

const idCardUpload = createImageUpload("id-cards");

userRouter.post(
  "/:id/id-card",
  authenticate,
  idCardUpload.single("file"),
  userController.uploadIdCard,
);
userRouter.post("/:id/id-card/ocr-mock", authenticate, userController.ocrMock);
userRouter.post("/:id/face-verify", authenticate, userController.faceVerify);
