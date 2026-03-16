/*
  Warnings:

  - A unique constraint covering the columns `[permName]` on the table `sys_permission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sys_permission" ADD COLUMN     "title" VARCHAR(50) NOT NULL DEFAULT '',
ALTER COLUMN "permName" SET DEFAULT '',
ALTER COLUMN "permCode" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "sys_permission_permName_key" ON "sys_permission"("permName");

-- CreateIndex
CREATE INDEX "sys_permission_permName_idx" ON "sys_permission"("permName");
