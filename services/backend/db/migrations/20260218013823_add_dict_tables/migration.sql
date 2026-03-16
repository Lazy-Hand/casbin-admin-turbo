-- CreateTable
CREATE TABLE "sys_dict_type" (
    "id" SERIAL NOT NULL,
    "dictName" VARCHAR(100) NOT NULL,
    "dictCode" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_dict_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_dict_item" (
    "id" SERIAL NOT NULL,
    "dictTypeId" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "colorType" VARCHAR(50) NOT NULL DEFAULT '',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_type_dictCode_key" ON "sys_dict_type"("dictCode");

-- CreateIndex
CREATE INDEX "sys_dict_type_dictCode_idx" ON "sys_dict_type"("dictCode");

-- CreateIndex
CREATE INDEX "sys_dict_type_status_idx" ON "sys_dict_type"("status");

-- CreateIndex
CREATE INDEX "sys_dict_item_dictTypeId_idx" ON "sys_dict_item"("dictTypeId");

-- CreateIndex
CREATE INDEX "sys_dict_item_sort_idx" ON "sys_dict_item"("sort");

-- CreateIndex
CREATE INDEX "sys_dict_item_status_idx" ON "sys_dict_item"("status");

-- AddForeignKey
ALTER TABLE "sys_dict_item" ADD CONSTRAINT "sys_dict_item_dictTypeId_fkey" FOREIGN KEY ("dictTypeId") REFERENCES "sys_dict_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
