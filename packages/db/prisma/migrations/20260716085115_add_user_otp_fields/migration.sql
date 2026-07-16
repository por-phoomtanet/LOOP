-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otpCodeHash" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "otpMethod" TEXT,
ADD COLUMN     "otpVerifiedAt" TIMESTAMP(3);
