/*
  Warnings:

  - You are about to drop the column `eventId` on the `Media` table. All the data in the column will be lost.
  - Added the required column `memberId` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Media" DROP CONSTRAINT "Media_eventId_fkey";

-- AlterTable
ALTER TABLE "public"."Media" DROP COLUMN "eventId",
ADD COLUMN     "memberId" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "speechId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Speech" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "flowId" TEXT NOT NULL,

    CONSTRAINT "Speech_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Flow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_speechId_fkey" FOREIGN KEY ("speechId") REFERENCES "public"."Speech"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Speech" ADD CONSTRAINT "Speech_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "public"."Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Flow" ADD CONSTRAINT "Flow_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
