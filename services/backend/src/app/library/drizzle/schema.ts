import { relations } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const ResourceType = pgEnum('ResourceType', ['menu', 'api', 'button']);

export const MenuType = pgEnum('MenuType', [
  'menu',
  'page',
  'link',
  'iframe',
  'window',
  'divider',
  'group',
]);

export const FileType = pgEnum('FileType', [
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'DOCUMENT',
  'ARCHIVE',
  'FILE',
]);

export const TaskType = pgEnum('TaskType', ['HTTP', 'SCRIPT']);

export const LogOperation = pgEnum('LogOperation', ['CREATE', 'UPDATE', 'DELETE']);

export const DataScope = pgEnum('DataScope', ['ALL', 'CUSTOM', 'DEPT', 'DEPT_AND_CHILD']);

export const User = pgTable(
  'sys_user',
  {
    id: serial('id').notNull().primaryKey(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    nickname: text('nickname').notNull(),
    email: text('email').notNull(),
    mobile: text('mobile').notNull(),
    gender: integer('gender').notNull(),
    avatar: text('avatar').notNull(),
    status: integer('status').notNull().default(1),
    isAdmin: boolean('is_admin').notNull(),
    deptId: integer('dept_id'),
    postId: integer('post_id'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
    createdBy: integer('createdBy'),
    updatedBy: integer('updatedBy'),
    deletedBy: integer('deletedBy'),
  },
  (User) => ({
    sys_user_dept_fkey: foreignKey({
      name: 'sys_user_dept_fkey',
      columns: [User.deptId],
      foreignColumns: [Dept.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    sys_user_post_fkey: foreignKey({
      name: 'sys_user_post_fkey',
      columns: [User.postId],
      foreignColumns: [Post.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Role = pgTable('sys_role', {
  id: serial('id').notNull().primaryKey(),
  roleName: text('roleName').notNull(),
  roleCode: text('roleCode').notNull().unique(),
  status: integer('status').notNull().default(1),
  description: text('description').notNull(),
  dataScope: DataScope('data_scope').notNull().default('DEPT'),
  customDepts: integer('custom_depts').array().notNull().default([]),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const Permission = pgTable('sys_permission', {
  id: serial('id').notNull().primaryKey(),
  permName: text('permName').notNull(),
  permCode: text('permCode').notNull().unique(),
  method: text('method').notNull(),
  component: text('component').notNull(),
  resourceType: ResourceType('resourceType'),
  menuType: MenuType('menuType'),
  path: text('path').notNull(),
  icon: text('icon').notNull(),
  sort: integer('sort').notNull(),
  cache: integer('cache').notNull(),
  hidden: integer('hidden').notNull(),
  frameUrl: text('frameUrl').notNull(),
  status: integer('status').notNull().default(1),
  parentId: integer('parentId'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const UserRole = pgTable(
  'sys_user_role',
  {
    userId: integer('userId').notNull(),
    roleId: integer('roleId').notNull(),
  },
  (UserRole) => ({
    sys_user_role_user_fkey: foreignKey({
      name: 'sys_user_role_user_fkey',
      columns: [UserRole.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    sys_user_role_role_fkey: foreignKey({
      name: 'sys_user_role_role_fkey',
      columns: [UserRole.roleId],
      foreignColumns: [Role.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    UserRole_cpk: primaryKey({
      name: 'UserRole_cpk',
      columns: [UserRole.userId, UserRole.roleId],
    }),
  }),
);

export const RolePermission = pgTable(
  'sys_role_permission',
  {
    roleId: integer('roleId').notNull(),
    permissionId: integer('permissionId').notNull(),
  },
  (RolePermission) => ({
    sys_role_permission_role_fkey: foreignKey({
      name: 'sys_role_permission_role_fkey',
      columns: [RolePermission.roleId],
      foreignColumns: [Role.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    sys_role_permission_permission_fkey: foreignKey({
      name: 'sys_role_permission_permission_fkey',
      columns: [RolePermission.permissionId],
      foreignColumns: [Permission.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    RolePermission_cpk: primaryKey({
      name: 'RolePermission_cpk',
      columns: [RolePermission.roleId, RolePermission.permissionId],
    }),
  }),
);

export const SysFile = pgTable('sys_file', {
  id: serial('id').notNull().primaryKey(),
  filename: text('filename').notNull().unique(),
  originalName: text('originalName').notNull(),
  size: integer('size').notNull(),
  mimetype: text('mimetype').notNull(),
  path: text('path').notNull(),
  extension: text('extension').notNull(),
  fileType: FileType('fileType').notNull().default('FILE'),
  isPublic: boolean('isPublic').notNull(),
  status: integer('status').notNull().default(1),
  businessId: integer('businessId'),
  businessType: text('businessType'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const Timer = pgTable('sys_timer', {
  id: serial('id').notNull().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  cron: text('cron').notNull(),
  taskType: TaskType('taskType').notNull().default('HTTP'),
  target: text('target').notNull(),
  params: jsonb('params'),
  status: integer('status').notNull().default(1),
  lastRunAt: timestamp('lastRunAt', { precision: 3, mode: 'string' }),
  nextRunAt: timestamp('nextRunAt', { precision: 3, mode: 'string' }),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const TimerExecutionLog = pgTable(
  'sys_timer_execution_log',
  {
    id: serial('id').notNull().primaryKey(),
    timerId: integer('timerId').notNull(),
    status: integer('status').notNull(),
    startAt: timestamp('startAt', { precision: 3, mode: 'string' }).notNull(),
    endAt: timestamp('endAt', { precision: 3, mode: 'string' }),
    duration: integer('duration'),
    result: text('result'),
  },
  (TimerExecutionLog) => ({
    sys_timer_execution_log_timer_fkey: foreignKey({
      name: 'sys_timer_execution_log_timer_fkey',
      columns: [TimerExecutionLog.timerId],
      foreignColumns: [Timer.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const LoginLog = pgTable(
  'sys_login_log',
  {
    id: serial('id').notNull().primaryKey(),
    userId: integer('userId'),
    username: text('username').notNull(),
    ip: text('ip'),
    userAgent: text('userAgent'),
    status: integer('status').notNull().default(1),
    message: text('message'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  },
  (LoginLog) => ({
    sys_login_log_user_fkey: foreignKey({
      name: 'sys_login_log_user_fkey',
      columns: [LoginLog.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const DictType = pgTable('sys_dict_type', {
  id: serial('id').notNull().primaryKey(),
  dictName: text('dictName').notNull(),
  dictCode: text('dictCode').notNull().unique(),
  description: text('description').notNull(),
  status: integer('status').notNull().default(1),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const DictItem = pgTable(
  'sys_dict_item',
  {
    id: serial('id').notNull().primaryKey(),
    dictTypeId: integer('dictTypeId').notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
    colorType: text('colorType').notNull(),
    sort: integer('sort').notNull(),
    status: integer('status').notNull().default(1),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
    createdBy: integer('createdBy'),
    updatedBy: integer('updatedBy'),
    deletedBy: integer('deletedBy'),
  },
  (DictItem) => ({
    sys_dict_item_dictType_fkey: foreignKey({
      name: 'sys_dict_item_dictType_fkey',
      columns: [DictItem.dictTypeId],
      foreignColumns: [DictType.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const OperationLog = pgTable('sys_operation_log', {
  id: serial('id').notNull().primaryKey(),
  userId: integer('userId'),
  username: text('username').notNull(),
  module: text('module').notNull(),
  operation: LogOperation('operation').notNull().default('CREATE'),
  description: text('description'),
  method: text('method').notNull(),
  path: text('path').notNull(),
  params: jsonb('params'),
  ip: text('ip'),
  userAgent: text('userAgent'),
  status: integer('status').notNull().default(1),
  result: text('result'),
  duration: integer('duration'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
});

export const Dept = pgTable(
  'sys_dept',
  {
    id: serial('id').notNull().primaryKey(),
    name: text('name').notNull(),
    parentId: integer('parent_id'),
    ancestors: text('ancestors'),
    leaderId: integer('leader_id'),
    status: integer('status').notNull().default(1),
    sort: integer('sort').notNull(),
    remark: text('remark'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
    createdBy: integer('createdBy'),
    updatedBy: integer('updatedBy'),
    deletedBy: integer('deletedBy'),
  },
  (Dept) => ({
    sys_dept_parent_fkey: foreignKey({
      name: 'sys_dept_parent_fkey',
      columns: [Dept.parentId],
      foreignColumns: [Dept.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    sys_dept_leader_fkey: foreignKey({
      name: 'sys_dept_leader_fkey',
      columns: [Dept.leaderId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Post = pgTable('sys_post', {
  id: serial('id').notNull().primaryKey(),
  postName: text('postName').notNull(),
  postCode: text('postCode').notNull().unique(),
  sort: integer('sort').notNull(),
  status: integer('status').notNull().default(1),
  remark: text('remark'),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const SysConfig = pgTable('sys_config', {
  id: serial('id').notNull().primaryKey(),
  configKey: text('configKey').notNull().unique(),
  configValue: text('configValue').notNull(),
  description: text('description').notNull(),
  status: integer('status').notNull().default(1),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' }),
  createdBy: integer('createdBy'),
  updatedBy: integer('updatedBy'),
  deletedBy: integer('deletedBy'),
});

export const UserRelations = relations(User, ({ many, one }) => ({
  roles: many(UserRole, {
    relationName: 'UserToUserRole',
  }),
  loginLogs: many(LoginLog, {
    relationName: 'LoginLogToUser',
  }),
  dept: one(Dept, {
    relationName: 'DeptUsers',
    fields: [User.deptId],
    references: [Dept.id],
  }),
  ledDepts: many(Dept, {
    relationName: 'DeptLeader',
  }),
  post: one(Post, {
    relationName: 'PostToUser',
    fields: [User.postId],
    references: [Post.id],
  }),
}));

export const RoleRelations = relations(Role, ({ many }) => ({
  users: many(UserRole, {
    relationName: 'RoleToUserRole',
  }),
  permissions: many(RolePermission, {
    relationName: 'RoleToRolePermission',
  }),
}));

export const PermissionRelations = relations(Permission, ({ many }) => ({
  roles: many(RolePermission, {
    relationName: 'PermissionToRolePermission',
  }),
}));

export const UserRoleRelations = relations(UserRole, ({ one }) => ({
  user: one(User, {
    relationName: 'UserToUserRole',
    fields: [UserRole.userId],
    references: [User.id],
  }),
  role: one(Role, {
    relationName: 'RoleToUserRole',
    fields: [UserRole.roleId],
    references: [Role.id],
  }),
}));

export const RolePermissionRelations = relations(RolePermission, ({ one }) => ({
  role: one(Role, {
    relationName: 'RoleToRolePermission',
    fields: [RolePermission.roleId],
    references: [Role.id],
  }),
  permission: one(Permission, {
    relationName: 'PermissionToRolePermission',
    fields: [RolePermission.permissionId],
    references: [Permission.id],
  }),
}));

export const TimerRelations = relations(Timer, ({ many }) => ({
  executionLogs: many(TimerExecutionLog, {
    relationName: 'TimerToTimerExecutionLog',
  }),
}));

export const TimerExecutionLogRelations = relations(TimerExecutionLog, ({ one }) => ({
  timer: one(Timer, {
    relationName: 'TimerToTimerExecutionLog',
    fields: [TimerExecutionLog.timerId],
    references: [Timer.id],
  }),
}));

export const LoginLogRelations = relations(LoginLog, ({ one }) => ({
  user: one(User, {
    relationName: 'LoginLogToUser',
    fields: [LoginLog.userId],
    references: [User.id],
  }),
}));

export const DictTypeRelations = relations(DictType, ({ many }) => ({
  items: many(DictItem, {
    relationName: 'DictItemToDictType',
  }),
}));

export const DictItemRelations = relations(DictItem, ({ one }) => ({
  dictType: one(DictType, {
    relationName: 'DictItemToDictType',
    fields: [DictItem.dictTypeId],
    references: [DictType.id],
  }),
}));

export const DeptRelations = relations(Dept, ({ many, one }) => ({
  users: many(User, {
    relationName: 'DeptUsers',
  }),
  children: many(Dept, {
    relationName: 'DeptToDept',
  }),
  parent: one(Dept, {
    relationName: 'DeptToDept',
    fields: [Dept.parentId],
    references: [Dept.id],
  }),
  leader: one(User, {
    relationName: 'DeptLeader',
    fields: [Dept.leaderId],
    references: [User.id],
  }),
}));

export const PostRelations = relations(Post, ({ many }) => ({
  users: many(User, {
    relationName: 'PostToUser',
  }),
}));
