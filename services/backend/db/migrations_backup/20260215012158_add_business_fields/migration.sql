-- AlterTable
ALTER TABLE "sys_file" ADD COLUMN     "businessId" INTEGER,
ADD COLUMN     "businessType" VARCHAR(100);

-- CreateIndex
CREATE INDEX "sys_file_businessId_idx" ON "sys_file"("businessId");

-- CreateIndex
CREATE INDEX "sys_file_businessType_idx" ON "sys_file"("businessType");
