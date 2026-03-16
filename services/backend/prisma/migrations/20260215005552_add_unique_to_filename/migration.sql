/*
  Warnings:

  - A unique constraint covering the columns `[filename]` on the table `sys_file` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "sys_file_filename_key" ON "sys_file"("filename");
