/*
  Warnings:

  - Added the required column `updatedAt` to the `sys_permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sys_role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sys_user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sys_permission" ADD COLUMN     "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "deletedBy" INTEGER,
ADD COLUMN     "deteledAt" TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP NOT NULL,
ADD COLUMN     "updatedBy" INTEGER;

-- AlterTable
ALTER TABLE "sys_role" ADD COLUMN     "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "deletedBy" INTEGER,
ADD COLUMN     "deteledAt" TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP NOT NULL,
ADD COLUMN     "updatedBy" INTEGER;

-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "deletedBy" INTEGER,
ADD COLUMN     "deteledAt" TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP NOT NULL,
ADD COLUMN     "updatedBy" INTEGER;
