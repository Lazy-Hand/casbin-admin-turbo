-- CreateTable
CREATE TABLE "sys_role" (
    "id" SERIAL NOT NULL,
    "roleName" VARCHAR(50) NOT NULL,
    "roleCode" VARCHAR(50) NOT NULL,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_permission" (
    "id" SERIAL NOT NULL,
    "permName" VARCHAR(50) NOT NULL,
    "permCode" VARCHAR(50) NOT NULL,
    "method" VARCHAR(50) NOT NULL DEFAULT '',
    "resourceType" VARCHAR(10) NOT NULL,
    "menuType" VARCHAR(10) NOT NULL DEFAULT '',

    CONSTRAINT "sys_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "sys_role_permission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_roleCode_key" ON "sys_role"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "sys_permission_permCode_key" ON "sys_permission"("permCode");

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sys_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sys_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "sys_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
