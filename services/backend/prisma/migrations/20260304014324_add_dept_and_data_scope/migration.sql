-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('ALL', 'CUSTOM', 'DEPT', 'DEPT_AND_CHILD');

-- AlterTable
ALTER TABLE "sys_role" ADD COLUMN     "custom_depts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "data_scope" "DataScope" NOT NULL DEFAULT 'DEPT';

-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "dept_id" INTEGER;

-- CreateTable
CREATE TABLE "sys_dept" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "parent_id" INTEGER,
    "ancestors" TEXT,
    "leader_id" INTEGER,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deteled_at" TIMESTAMP(3),
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_dept_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_dept_parent_id_idx" ON "sys_dept"("parent_id");

-- CreateIndex
CREATE INDEX "sys_dept_ancestors_idx" ON "sys_dept"("ancestors");

-- CreateIndex
CREATE INDEX "sys_dept_status_idx" ON "sys_dept"("status");

-- CreateIndex
CREATE INDEX "sys_user_dept_id_idx" ON "sys_user"("dept_id");

-- AddForeignKey
ALTER TABLE "sys_user" ADD CONSTRAINT "sys_user_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_dept" ADD CONSTRAINT "sys_dept_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sys_dept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_dept" ADD CONSTRAINT "sys_dept_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
