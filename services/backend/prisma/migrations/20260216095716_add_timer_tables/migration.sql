-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('HTTP', 'SCRIPT');

-- CreateTable
CREATE TABLE "sys_timer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "cron" VARCHAR(50) NOT NULL,
    "taskType" "TaskType" NOT NULL DEFAULT 'HTTP',
    "target" VARCHAR(1000) NOT NULL,
    "params" JSONB,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "lastRunAt" TIMESTAMP,
    "nextRunAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deteledAt" TIMESTAMP,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "sys_timer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_timer_execution_log" (
    "id" SERIAL NOT NULL,
    "timerId" INTEGER NOT NULL,
    "status" SMALLINT NOT NULL,
    "startAt" TIMESTAMP NOT NULL,
    "endAt" TIMESTAMP,
    "duration" INTEGER,
    "result" TEXT,

    CONSTRAINT "sys_timer_execution_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_timer_status_idx" ON "sys_timer"("status");

-- CreateIndex
CREATE INDEX "sys_timer_createdAt_idx" ON "sys_timer"("createdAt");

-- CreateIndex
CREATE INDEX "sys_timer_execution_log_timerId_idx" ON "sys_timer_execution_log"("timerId");

-- CreateIndex
CREATE INDEX "sys_timer_execution_log_startAt_idx" ON "sys_timer_execution_log"("startAt");

-- AddForeignKey
ALTER TABLE "sys_timer_execution_log" ADD CONSTRAINT "sys_timer_execution_log_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "sys_timer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
