import { relations } from "drizzle-orm/relations";
import { sysUser, sysLoginLog, sysTimer, sysTimerExecutionLog, sysDictType, sysDictItem, sysDept, sysPost, sysUserRole, sysRole, sysRolePermission, sysPermission } from "./schema";

export const sysLoginLogRelations = relations(sysLoginLog, ({one}) => ({
	sysUser: one(sysUser, {
		fields: [sysLoginLog.userId],
		references: [sysUser.id]
	}),
}));

export const sysUserRelations = relations(sysUser, ({one, many}) => ({
	sysLoginLogs: many(sysLoginLog),
	sysDepts: many(sysDept, {
		relationName: "sysDept_leaderId_sysUser_id"
	}),
	sysDept: one(sysDept, {
		fields: [sysUser.deptId],
		references: [sysDept.id],
		relationName: "sysUser_deptId_sysDept_id"
	}),
	sysPost: one(sysPost, {
		fields: [sysUser.postId],
		references: [sysPost.id]
	}),
	sysUserRoles: many(sysUserRole),
}));

export const sysTimerExecutionLogRelations = relations(sysTimerExecutionLog, ({one}) => ({
	sysTimer: one(sysTimer, {
		fields: [sysTimerExecutionLog.timerId],
		references: [sysTimer.id]
	}),
}));

export const sysTimerRelations = relations(sysTimer, ({many}) => ({
	sysTimerExecutionLogs: many(sysTimerExecutionLog),
}));

export const sysDictItemRelations = relations(sysDictItem, ({one}) => ({
	sysDictType: one(sysDictType, {
		fields: [sysDictItem.dictTypeId],
		references: [sysDictType.id]
	}),
}));

export const sysDictTypeRelations = relations(sysDictType, ({many}) => ({
	sysDictItems: many(sysDictItem),
}));

export const sysDeptRelations = relations(sysDept, ({one, many}) => ({
	sysDept: one(sysDept, {
		fields: [sysDept.parentId],
		references: [sysDept.id],
		relationName: "sysDept_parentId_sysDept_id"
	}),
	sysDepts: many(sysDept, {
		relationName: "sysDept_parentId_sysDept_id"
	}),
	sysUser: one(sysUser, {
		fields: [sysDept.leaderId],
		references: [sysUser.id],
		relationName: "sysDept_leaderId_sysUser_id"
	}),
	sysUsers: many(sysUser, {
		relationName: "sysUser_deptId_sysDept_id"
	}),
}));

export const sysPostRelations = relations(sysPost, ({many}) => ({
	sysUsers: many(sysUser),
}));

export const sysUserRoleRelations = relations(sysUserRole, ({one}) => ({
	sysUser: one(sysUser, {
		fields: [sysUserRole.userId],
		references: [sysUser.id]
	}),
	sysRole: one(sysRole, {
		fields: [sysUserRole.roleId],
		references: [sysRole.id]
	}),
}));

export const sysRoleRelations = relations(sysRole, ({many}) => ({
	sysUserRoles: many(sysUserRole),
	sysRolePermissions: many(sysRolePermission),
}));

export const sysRolePermissionRelations = relations(sysRolePermission, ({one}) => ({
	sysRole: one(sysRole, {
		fields: [sysRolePermission.roleId],
		references: [sysRole.id]
	}),
	sysPermission: one(sysPermission, {
		fields: [sysRolePermission.permissionId],
		references: [sysPermission.id]
	}),
}));

export const sysPermissionRelations = relations(sysPermission, ({many}) => ({
	sysRolePermissions: many(sysRolePermission),
}));