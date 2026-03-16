-- CreateIndex
CREATE INDEX "sys_permission_permCode_idx" ON "sys_permission"("permCode");

-- CreateIndex
CREATE INDEX "sys_permission_resourceType_idx" ON "sys_permission"("resourceType");

-- CreateIndex
CREATE INDEX "sys_permission_method_path_idx" ON "sys_permission"("method", "path");

-- CreateIndex
CREATE INDEX "sys_role_roleCode_idx" ON "sys_role"("roleCode");

-- CreateIndex
CREATE INDEX "sys_role_permission_roleId_idx" ON "sys_role_permission"("roleId");

-- CreateIndex
CREATE INDEX "sys_role_permission_permissionId_idx" ON "sys_role_permission"("permissionId");

-- CreateIndex
CREATE INDEX "sys_user_username_idx" ON "sys_user"("username");

-- CreateIndex
CREATE INDEX "sys_user_role_userId_idx" ON "sys_user_role"("userId");

-- CreateIndex
CREATE INDEX "sys_user_role_roleId_idx" ON "sys_user_role"("roleId");
