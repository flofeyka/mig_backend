/*
  Warnings:

  - You are about to drop the column `processedById` on the `OrderMedia` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `OrderMedia` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrderMedia" DROP CONSTRAINT "OrderMedia_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_mediaId_fkey";

-- AlterTable
ALTER TABLE "public"."OrderMedia" DROP COLUMN "processedById",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "mediaId";

-- CreateTable
CREATE TABLE "public"."_OrderMediaToUser" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OrderMediaToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrderMediaToUser_B_index" ON "public"."_OrderMediaToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."_OrderMediaToUser" ADD CONSTRAINT "_OrderMediaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."OrderMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_OrderMediaToUser" ADD CONSTRAINT "_OrderMediaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
