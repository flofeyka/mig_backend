/*
  Warnings:

  - You are about to drop the column `userId` on the `Member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Member" DROP CONSTRAINT "Member_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Member" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "public"."OrderMedia" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "requiresProcessing" BOOLEAN NOT NULL DEFAULT false,
    "processingPrice" DECIMAL(10,2),
    "processedPreview" TEXT,
    "processedFullVersion" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedById" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "OrderMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderMedia_orderId_idx" ON "public"."OrderMedia"("orderId");

-- CreateIndex
CREATE INDEX "OrderMedia_mediaId_idx" ON "public"."OrderMedia"("mediaId");

-- CreateIndex
CREATE INDEX "OrderMedia_orderId_requiresProcessing_idx" ON "public"."OrderMedia"("orderId", "requiresProcessing");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMedia_orderId_mediaId_key" ON "public"."OrderMedia"("orderId", "mediaId");

-- AddForeignKey
ALTER TABLE "public"."OrderMedia" ADD CONSTRAINT "OrderMedia_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderMedia" ADD CONSTRAINT "OrderMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderMedia" ADD CONSTRAINT "OrderMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
