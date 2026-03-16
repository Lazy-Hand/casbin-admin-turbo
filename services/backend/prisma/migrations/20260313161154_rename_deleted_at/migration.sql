ALTER TABLE "sys_user"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_role"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_permission"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_file"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_timer"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_dict_type"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_dict_item"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_dept"
RENAME COLUMN "deteled_at" TO "deletedAt";

ALTER TABLE "sys_post"
RENAME COLUMN "deteledAt" TO "deletedAt";

ALTER TABLE "sys_config"
RENAME COLUMN "deteledAt" TO "deletedAt";
