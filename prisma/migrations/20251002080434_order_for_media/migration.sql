/*
  Warnings:

  - Added the required column `order` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Media" ADD COLUMN     "order" INTEGER NOT NULL;
