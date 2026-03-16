/*
  Warnings:

  - The `resourceType` column on the `sys_permission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `menuType` column on the `sys_permission` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('menu', 'api', 'button');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('menu', 'page', 'link', 'iframe', 'window');

-- AlterTable
ALTER TABLE "sys_permission" DROP COLUMN "resourceType",
ADD COLUMN     "resourceType" "ResourceType",
DROP COLUMN "menuType",
ADD COLUMN     "menuType" "MenuType";

-- CreateIndex
CREATE INDEX "sys_permission_resourceType_idx" ON "sys_permission"("resourceType");
