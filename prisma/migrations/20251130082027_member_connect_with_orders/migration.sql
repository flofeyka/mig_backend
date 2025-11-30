/*
  Warnings:

  - You are about to drop the `_OrderToSpeech` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SpeechToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_OrderToSpeech" DROP CONSTRAINT "_OrderToSpeech_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_OrderToSpeech" DROP CONSTRAINT "_OrderToSpeech_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SpeechToUser" DROP CONSTRAINT "_SpeechToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SpeechToUser" DROP CONSTRAINT "_SpeechToUser_B_fkey";

-- DropTable
DROP TABLE "public"."_OrderToSpeech";

-- DropTable
DROP TABLE "public"."_SpeechToUser";

-- CreateTable
CREATE TABLE "public"."_MemberToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberToOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MemberToUser" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MemberToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MemberToOrder_B_index" ON "public"."_MemberToOrder"("B");

-- CreateIndex
CREATE INDEX "_MemberToUser_B_index" ON "public"."_MemberToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."_MemberToOrder" ADD CONSTRAINT "_MemberToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToOrder" ADD CONSTRAINT "_MemberToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
