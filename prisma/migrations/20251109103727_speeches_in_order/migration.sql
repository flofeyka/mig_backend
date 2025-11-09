-- CreateTable
CREATE TABLE "public"."_OrderToSpeech" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderToSpeech_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrderToSpeech_B_index" ON "public"."_OrderToSpeech"("B");

-- AddForeignKey
ALTER TABLE "public"."_OrderToSpeech" ADD CONSTRAINT "_OrderToSpeech_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_OrderToSpeech" ADD CONSTRAINT "_OrderToSpeech_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;
