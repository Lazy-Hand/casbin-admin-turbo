-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "post_id" INTEGER;

-- CreateTable
CREATE TABLE "sys_post" (
    "id" SERIAL NOT NULL,
    "postName" VARCHAR(50) NOT NULL,
    "postCode" VARCHAR(50) NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "remark" VARCHAR(500),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_post_postCode_key" ON "sys_post"("postCode");

-- CreateIndex
CREATE INDEX "sys_post_postCode_idx" ON "sys_post"("postCode");

-- CreateIndex
CREATE INDEX "sys_post_status_idx" ON "sys_post"("status");

-- CreateIndex
CREATE INDEX "sys_user_post_id_idx" ON "sys_user"("post_id");

-- AddForeignKey
ALTER TABLE "sys_user" ADD CONSTRAINT "sys_user_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "sys_post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
