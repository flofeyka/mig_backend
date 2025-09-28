/*
  Warnings:

  - You are about to drop the column `url` on the `Media` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[filename]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fullVersion]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[preview]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `filename` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullVersion` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preview` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Media" DROP COLUMN "url",
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "fullVersion" TEXT NOT NULL,
ADD COLUMN     "preview" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Media_filename_key" ON "public"."Media"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "Media_fullVersion_key" ON "public"."Media"("fullVersion");

-- CreateIndex
CREATE UNIQUE INDEX "Media_preview_key" ON "public"."Media"("preview");
