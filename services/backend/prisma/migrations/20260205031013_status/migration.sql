-- AlterTable
ALTER TABLE "sys_permission" ADD COLUMN     "cache" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "hidden" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "icon" VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sys_role" ADD COLUMN     "description" VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "avatar" VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN     "email" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN     "gender" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "mobile" VARCHAR(18) NOT NULL DEFAULT '',
ADD COLUMN     "nickname" VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "sys_user_mobile_idx" ON "sys_user"("mobile");

-- CreateIndex
CREATE INDEX "sys_user_email_idx" ON "sys_user"("email");
