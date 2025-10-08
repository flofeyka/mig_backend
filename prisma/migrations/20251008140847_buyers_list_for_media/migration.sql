/*
  Warnings:

  - You are about to drop the `_MemberToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_MemberToUser" DROP CONSTRAINT "_MemberToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_MemberToUser" DROP CONSTRAINT "_MemberToUser_B_fkey";

-- AlterTable
ALTER TABLE "public"."Member" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "mediaId" TEXT;

-- DropTable
DROP TABLE "public"."_MemberToUser";

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
