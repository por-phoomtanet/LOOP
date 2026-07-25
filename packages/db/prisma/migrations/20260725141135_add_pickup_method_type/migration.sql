-- CreateEnum
CREATE TYPE "PickupMethod" AS ENUM ('MEETUP', 'GRAB', 'POST');

-- AlterTable
ALTER TABLE "PickupOption" ADD COLUMN     "type" "PickupMethod" NOT NULL DEFAULT 'MEETUP';
