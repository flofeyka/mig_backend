/*
  Warnings:

  - A unique constraint covering the columns `[systemId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payment_systemId_key" ON "public"."Payment"("systemId");
