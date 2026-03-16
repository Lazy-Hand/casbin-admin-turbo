/*
  Warnings:

  - You are about to drop the column `title` on the `sys_permission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "sys_permission_permName_idx";

-- DropIndex
DROP INDEX "sys_permission_permName_key";

-- AlterTable
ALTER TABLE "sys_permission" DROP COLUMN "title",
ALTER COLUMN "permName" DROP DEFAULT;
