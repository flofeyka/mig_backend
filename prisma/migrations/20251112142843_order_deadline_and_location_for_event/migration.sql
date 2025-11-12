-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'Moscow, Russia',
ADD COLUMN     "orderDeadline" TIMESTAMP(3);
