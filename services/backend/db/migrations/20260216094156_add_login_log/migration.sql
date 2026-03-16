-- CreateTable
CREATE TABLE "sys_login_log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(50),
    "userAgent" VARCHAR(500),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "message" VARCHAR(200),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_login_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_login_log_userId_idx" ON "sys_login_log"("userId");

-- CreateIndex
CREATE INDEX "sys_login_log_username_idx" ON "sys_login_log"("username");

-- CreateIndex
CREATE INDEX "sys_login_log_createdAt_idx" ON "sys_login_log"("createdAt");

-- AddForeignKey
ALTER TABLE "sys_login_log" ADD CONSTRAINT "sys_login_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
