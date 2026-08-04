-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idCardAddress" TEXT,
ADD COLUMN     "idCardDob" TIMESTAMP(3),
ADD COLUMN     "idCardNameEn" TEXT,
ADD COLUMN     "idCardNameTh" TEXT,
ADD COLUMN     "idCardNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_idCardNumber_key" ON "User"("idCardNumber");

