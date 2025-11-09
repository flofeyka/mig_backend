-- CreateTable
CREATE TABLE "public"."_SpeechToUser" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SpeechToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SpeechToUser_B_index" ON "public"."_SpeechToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."_SpeechToUser" ADD CONSTRAINT "_SpeechToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SpeechToUser" ADD CONSTRAINT "_SpeechToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
