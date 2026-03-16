import type {
  DataScope,
  Dept,
  DictItem,
  DictType,
  FileType,
  LoginLog,
  LogOperation,
  MenuType,
  OperationLog,
  Permission,
  Post,
  ResourceType,
  Role,
  RolePermission,
  SysConfig,
  SysFile,
  TaskType,
  Timer,
  TimerExecutionLog,
  User,
  UserRole,
} from './schema';

export type UserModel = typeof User.$inferSelect;
export type NewUserModel = typeof User.$inferInsert;

export type RoleModel = typeof Role.$inferSelect;
export type NewRoleModel = typeof Role.$inferInsert;

export type PermissionModel = typeof Permission.$inferSelect;
export type NewPermissionModel = typeof Permission.$inferInsert;

export type DeptModel = typeof Dept.$inferSelect;
export type NewDeptModel = typeof Dept.$inferInsert;

export type PostModel = typeof Post.$inferSelect;
export type NewPostModel = typeof Post.$inferInsert;

export type DictTypeModel = typeof DictType.$inferSelect;
export type NewDictTypeModel = typeof DictType.$inferInsert;

export type DictItemModel = typeof DictItem.$inferSelect;
export type NewDictItemModel = typeof DictItem.$inferInsert;

export type SysConfigModel = typeof SysConfig.$inferSelect;
export type NewSysConfigModel = typeof SysConfig.$inferInsert;

export type SysFileModel = typeof SysFile.$inferSelect;
export type NewSysFileModel = typeof SysFile.$inferInsert;

export type TimerModel = typeof Timer.$inferSelect;
export type NewTimerModel = typeof Timer.$inferInsert;

export type TimerExecutionLogModel = typeof TimerExecutionLog.$inferSelect;
export type NewTimerExecutionLogModel = typeof TimerExecutionLog.$inferInsert;

export type LoginLogModel = typeof LoginLog.$inferSelect;
export type NewLoginLogModel = typeof LoginLog.$inferInsert;

export type OperationLogModel = typeof OperationLog.$inferSelect;
export type NewOperationLogModel = typeof OperationLog.$inferInsert;

export type UserRoleModel = typeof UserRole.$inferSelect;
export type NewUserRoleModel = typeof UserRole.$inferInsert;

export type RolePermissionModel = typeof RolePermission.$inferSelect;
export type NewRolePermissionModel = typeof RolePermission.$inferInsert;

export type ResourceTypeValue = (typeof ResourceType.enumValues)[number];
export type MenuTypeValue = (typeof MenuType.enumValues)[number];
export type FileTypeValue = (typeof FileType.enumValues)[number];
export type TaskTypeValue = (typeof TaskType.enumValues)[number];
export type LogOperationValue = (typeof LogOperation.enumValues)[number];
export type DataScopeValue = (typeof DataScope.enumValues)[number];
