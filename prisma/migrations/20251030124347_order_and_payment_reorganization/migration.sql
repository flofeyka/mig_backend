/*
  Warnings:

  - You are about to drop the column `orderId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `_MediaToPayment` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "public"."_MediaToPayment" DROP CONSTRAINT "_MediaToPayment_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_MediaToPayment" DROP CONSTRAINT "_MediaToPayment_B_fkey";

-- DropIndex
DROP INDEX "public"."Payment_orderId_key";

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "status" SET DEFAULT 'WAITING_FOR_PAYMENT';

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "orderId";

-- DropTable
DROP TABLE "public"."_MediaToPayment";
