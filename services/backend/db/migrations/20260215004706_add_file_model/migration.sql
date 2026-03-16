-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'FILE');

-- CreateTable
CREATE TABLE "sys_file" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(500) NOT NULL,
    "size" INTEGER NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "extension" VARCHAR(20) NOT NULL,
    "fileType" "FileType" NOT NULL DEFAULT 'FILE',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_file_filename_idx" ON "sys_file"("filename");

-- CreateIndex
CREATE INDEX "sys_file_fileType_idx" ON "sys_file"("fileType");

-- CreateIndex
CREATE INDEX "sys_file_status_idx" ON "sys_file"("status");
