-- CreateTable
CREATE TABLE "sys_config" (
    "id" SERIAL NOT NULL,
    "configKey" VARCHAR(100) NOT NULL,
    "configValue" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_configKey_key" ON "sys_config"("configKey");

-- CreateIndex
CREATE INDEX "sys_config_configKey_idx" ON "sys_config"("configKey");

-- CreateIndex
CREATE INDEX "sys_config_status_idx" ON "sys_config"("status");
