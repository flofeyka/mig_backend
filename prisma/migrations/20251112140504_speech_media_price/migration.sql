/*
  Warnings:

  - You are about to drop the column `price` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Media" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 400;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "public"."Speech" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 2000;
