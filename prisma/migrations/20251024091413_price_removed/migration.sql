/*
  Warnings:

  - You are about to drop the column `price` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Media` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "public"."Media" DROP COLUMN "price";
