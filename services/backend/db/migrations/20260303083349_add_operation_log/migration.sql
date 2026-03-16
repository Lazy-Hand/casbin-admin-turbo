-- CreateEnum
CREATE TYPE "LogOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "sys_operation_log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "operation" "LogOperation" NOT NULL DEFAULT 'CREATE',
    "description" VARCHAR(500),
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "params" JSONB,
    "ip" VARCHAR(50),
    "userAgent" VARCHAR(500),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "result" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_operation_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_operation_log_userId_idx" ON "sys_operation_log"("userId");

-- CreateIndex
CREATE INDEX "sys_operation_log_module_idx" ON "sys_operation_log"("module");

-- CreateIndex
CREATE INDEX "sys_operation_log_operation_idx" ON "sys_operation_log"("operation");

-- CreateIndex
CREATE INDEX "sys_operation_log_createdAt_idx" ON "sys_operation_log"("createdAt");
