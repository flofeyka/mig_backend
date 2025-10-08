-- CreateTable
CREATE TABLE "public"."_MemberToUser" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MemberToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MemberToUser_B_index" ON "public"."_MemberToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
