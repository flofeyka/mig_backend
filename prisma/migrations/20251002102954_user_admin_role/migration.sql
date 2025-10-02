/*
  Warnings:

  - You are about to drop the column `eventId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "eventId",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
