/*
  Warnings:

  - You are about to drop the column `price15Day` on the `Product` table. Existing values are migrated into `ProductPriceTier` rows before the column is dropped.
  - You are about to drop the column `price30Day` on the `Product` table. Existing values are migrated into `ProductPriceTier` rows before the column is dropped.
  - You are about to drop the column `price3Day` on the `Product` table. Existing values are migrated into `ProductPriceTier` rows before the column is dropped.
  - You are about to drop the column `price7Day` on the `Product` table. Existing values are migrated into `ProductPriceTier` rows before the column is dropped.

*/
-- CreateTable
CREATE TABLE "ProductPriceTier" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPriceTier_productId_days_key" ON "ProductPriceTier"("productId", "days");

-- AddForeignKey
ALTER TABLE "ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: ย้ายราคาขั้นบันไดเดิม (คอลัมน์คงที่ 3/7/15/30 วัน) เข้าตารางลูกก่อนลบคอลัมน์เดิม
INSERT INTO "ProductPriceTier" ("productId", "days", "price")
SELECT "id", 3, "price3Day" FROM "Product" WHERE "price3Day" IS NOT NULL;

INSERT INTO "ProductPriceTier" ("productId", "days", "price")
SELECT "id", 7, "price7Day" FROM "Product" WHERE "price7Day" IS NOT NULL;

INSERT INTO "ProductPriceTier" ("productId", "days", "price")
SELECT "id", 15, "price15Day" FROM "Product" WHERE "price15Day" IS NOT NULL;

INSERT INTO "ProductPriceTier" ("productId", "days", "price")
SELECT "id", 30, "price30Day" FROM "Product" WHERE "price30Day" IS NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price15Day",
DROP COLUMN "price30Day",
DROP COLUMN "price3Day",
DROP COLUMN "price7Day";
