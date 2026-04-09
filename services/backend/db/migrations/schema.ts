import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  serial,
  varchar,
  integer,
  smallint,
  boolean,
  foreignKey,
  jsonb,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const dataScope = pgEnum("DataScope", ["ALL", "CUSTOM", "DEPT", "DEPT_AND_CHILD"]);
export const fileType = pgEnum("FileType", [
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "DOCUMENT",
  "ARCHIVE",
  "FILE",
]);
export const logOperation = pgEnum("LogOperation", ["CREATE", "UPDATE", "DELETE"]);
export const menuType = pgEnum("MenuType", [
  "menu",
  "page",
  "link",
  "iframe",
  "window",
  "divider",
  "group",
]);
export const resourceType = pgEnum("ResourceType", ["menu", "api", "button"]);
export const taskType = pgEnum("TaskType", ["HTTP", "SCRIPT"]);

export const schemaMigrations = pgTable("schema_migrations", {
  name: text().primaryKey().notNull(),
  checksum: text().notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const sysPermission = pgTable(
  "sys_permission",
  {
    id: serial().primaryKey().notNull(),
    permName: varchar({ length: 50 }).default("").notNull(),
    permCode: varchar({ length: 50 }).default("").notNull(),
    method: varchar({ length: 50 }).default("").notNull(),
    path: varchar({ length: 500 }).default("").notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: integer(),
    deletedBy: integer(),
    deletedAt: timestamp({ mode: "string" }),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    updatedBy: integer(),
    cache: smallint().default(0).notNull(),
    hidden: smallint().default(0).notNull(),
    icon: varchar({ length: 500 }).default("").notNull(),
    sort: integer().default(0).notNull(),
    status: smallint().default(1).notNull(),
    resourceType: resourceType(),
    menuType: menuType(),
    parentId: integer().default(0),
    component: varchar({ length: 500 }).default("").notNull(),
    frameUrl: varchar({ length: 500 }).default("").notNull(),
  },
  (table) => [
    index("sys_permission_method_path_idx").using(
      "btree",
      table.method.asc().nullsLast().op("text_ops"),
      table.path.asc().nullsLast().op("text_ops"),
    ),
    index("sys_permission_permCode_idx").using(
      "btree",
      table.permCode.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("sys_permission_permCode_key").using(
      "btree",
      table.permCode.asc().nullsLast().op("text_ops"),
    ),
    index("sys_permission_resourceType_idx").using(
      "btree",
      table.resourceType.asc().nullsLast().op("enum_ops"),
    ),
  ],
);

export const sysRole = pgTable(
  "sys_role",
  {
    id: serial().primaryKey().notNull(),
    roleName: varchar({ length: 50 }).notNull(),
    roleCode: varchar({ length: 50 }).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: integer(),
    deletedBy: integer(),
    deletedAt: timestamp({ mode: "string" }),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    updatedBy: integer(),
    description: varchar({ length: 500 }).default("").notNull(),
    status: smallint().default(1).notNull(),
    customDepts: integer("custom_depts").array().default([]),
    dataScope: dataScope("data_scope").default("DEPT").notNull(),
  },
  (table) => [
    index("sys_role_roleCode_idx").using("btree", table.roleCode.asc().nullsLast().op("text_ops")),
    uniqueIndex("sys_role_roleCode_key").using(
      "btree",
      table.roleCode.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const sysFile = pgTable(
  "sys_file",
  {
    id: serial().primaryKey().notNull(),
    filename: varchar({ length: 255 }).notNull(),
    originalName: varchar({ length: 500 }).notNull(),
    size: integer().notNull(),
    mimetype: varchar({ length: 100 }).notNull(),
    path: varchar({ length: 500 }).notNull(),
    extension: varchar({ length: 20 }).notNull(),
    fileType: fileType().default("FILE").notNull(),
    isPublic: boolean().default(false).notNull(),
    status: smallint().default(1).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
    businessId: integer(),
    businessType: varchar({ length: 100 }),
  },
  (table) => [
    index("sys_file_businessId_idx").using(
      "btree",
      table.businessId.asc().nullsLast().op("int4_ops"),
    ),
    index("sys_file_businessType_idx").using(
      "btree",
      table.businessType.asc().nullsLast().op("text_ops"),
    ),
    index("sys_file_fileType_idx").using("btree", table.fileType.asc().nullsLast().op("enum_ops")),
    index("sys_file_filename_idx").using("btree", table.filename.asc().nullsLast().op("text_ops")),
    uniqueIndex("sys_file_filename_key").using(
      "btree",
      table.filename.asc().nullsLast().op("text_ops"),
    ),
    index("sys_file_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
  ],
);

export const sysLoginLog = pgTable(
  "sys_login_log",
  {
    id: serial().primaryKey().notNull(),
    userId: integer(),
    username: varchar({ length: 50 }).notNull(),
    ip: varchar({ length: 50 }),
    userAgent: varchar({ length: 500 }),
    status: smallint().default(1).notNull(),
    message: varchar({ length: 200 }),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("sys_login_log_createdAt_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("sys_login_log_userId_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
    index("sys_login_log_username_idx").using(
      "btree",
      table.username.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [sysUser.id],
      name: "sys_login_log_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sysTimer = pgTable(
  "sys_timer",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: varchar({ length: 500 }),
    cron: varchar({ length: 50 }).notNull(),
    taskType: taskType().default("HTTP").notNull(),
    target: varchar({ length: 1000 }).notNull(),
    params: jsonb(),
    status: smallint().default(1).notNull(),
    lastRunAt: timestamp({ mode: "string" }),
    nextRunAt: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_timer_createdAt_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("sys_timer_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
  ],
);

export const sysTimerExecutionLog = pgTable(
  "sys_timer_execution_log",
  {
    id: serial().primaryKey().notNull(),
    timerId: integer().notNull(),
    status: smallint().notNull(),
    startAt: timestamp({ mode: "string" }).notNull(),
    endAt: timestamp({ mode: "string" }),
    duration: integer(),
    result: text(),
  },
  (table) => [
    index("sys_timer_execution_log_startAt_idx").using(
      "btree",
      table.startAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("sys_timer_execution_log_timerId_idx").using(
      "btree",
      table.timerId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.timerId],
      foreignColumns: [sysTimer.id],
      name: "sys_timer_execution_log_timerId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const sysDictType = pgTable(
  "sys_dict_type",
  {
    id: serial().primaryKey().notNull(),
    dictName: varchar({ length: 100 }).notNull(),
    dictCode: varchar({ length: 100 }).notNull(),
    description: varchar({ length: 500 }).default("").notNull(),
    status: smallint().default(1).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_dict_type_dictCode_idx").using(
      "btree",
      table.dictCode.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("sys_dict_type_dictCode_key").using(
      "btree",
      table.dictCode.asc().nullsLast().op("text_ops"),
    ),
    index("sys_dict_type_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
  ],
);

export const sysDictItem = pgTable(
  "sys_dict_item",
  {
    id: serial().primaryKey().notNull(),
    dictTypeId: integer().notNull(),
    label: varchar({ length: 100 }).notNull(),
    value: varchar({ length: 100 }).notNull(),
    colorType: varchar({ length: 50 }).default("").notNull(),
    sort: integer().default(0).notNull(),
    status: smallint().default(1).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_dict_item_dictTypeId_idx").using(
      "btree",
      table.dictTypeId.asc().nullsLast().op("int4_ops"),
    ),
    index("sys_dict_item_sort_idx").using("btree", table.sort.asc().nullsLast().op("int4_ops")),
    index("sys_dict_item_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
    foreignKey({
      columns: [table.dictTypeId],
      foreignColumns: [sysDictType.id],
      name: "sys_dict_item_dictTypeId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const sysOperationLog = pgTable(
  "sys_operation_log",
  {
    id: serial().primaryKey().notNull(),
    userId: integer(),
    username: varchar({ length: 50 }).notNull(),
    module: varchar({ length: 50 }).notNull(),
    operation: logOperation().default("CREATE").notNull(),
    description: varchar({ length: 500 }),
    method: varchar({ length: 10 }).notNull(),
    path: varchar({ length: 200 }).notNull(),
    params: jsonb(),
    ip: varchar({ length: 50 }),
    userAgent: varchar({ length: 500 }),
    status: smallint().default(1).notNull(),
    result: text(),
    duration: integer(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("sys_operation_log_createdAt_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("sys_operation_log_module_idx").using(
      "btree",
      table.module.asc().nullsLast().op("text_ops"),
    ),
    index("sys_operation_log_operation_idx").using(
      "btree",
      table.operation.asc().nullsLast().op("enum_ops"),
    ),
    index("sys_operation_log_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const sysDept = pgTable(
  "sys_dept",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 50 }).notNull(),
    parentId: integer("parent_id"),
    ancestors: text(),
    leaderId: integer("leader_id"),
    status: smallint().default(1).notNull(),
    sort: integer().default(0).notNull(),
    remark: varchar({ length: 500 }),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "string" }).notNull(),
    deletedAt: timestamp({ precision: 3, mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_dept_ancestors_idx").using(
      "btree",
      table.ancestors.asc().nullsLast().op("text_ops"),
    ),
    index("sys_dept_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
    index("sys_dept_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "sys_dept_parent_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.leaderId],
      foreignColumns: [sysUser.id],
      name: "sys_dept_leader_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sysUser = pgTable(
  "sys_user",
  {
    id: serial().primaryKey().notNull(),
    username: varchar({ length: 50 }).notNull(),
    password: varchar({ length: 500 }).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: integer(),
    deletedBy: integer(),
    deletedAt: timestamp({ mode: "string" }),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    updatedBy: integer(),
    avatar: varchar({ length: 500 }).default("").notNull(),
    email: varchar({ length: 100 }).default("").notNull(),
    gender: smallint().default(0).notNull(),
    mobile: varchar({ length: 18 }).default("").notNull(),
    nickname: varchar({ length: 50 }).default("").notNull(),
    status: smallint().default(1).notNull(),
    deptId: integer("dept_id"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    postId: integer("post_id"),
  },
  (table) => [
    index("sys_user_dept_id_idx").using("btree", table.deptId.asc().nullsLast().op("int4_ops")),
    index("sys_user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
    index("sys_user_mobile_idx").using("btree", table.mobile.asc().nullsLast().op("text_ops")),
    index("sys_user_post_id_idx").using("btree", table.postId.asc().nullsLast().op("int4_ops")),
    index("sys_user_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
    uniqueIndex("sys_user_username_key").using(
      "btree",
      table.username.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.deptId],
      foreignColumns: [sysDept.id],
      name: "sys_user_dept_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [sysPost.id],
      name: "sys_user_post_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sysPost = pgTable(
  "sys_post",
  {
    id: serial().primaryKey().notNull(),
    postName: varchar({ length: 50 }).notNull(),
    postCode: varchar({ length: 50 }).notNull(),
    sort: integer().default(0).notNull(),
    status: smallint().default(1).notNull(),
    remark: varchar({ length: 500 }),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_post_postCode_idx").using("btree", table.postCode.asc().nullsLast().op("text_ops")),
    uniqueIndex("sys_post_postCode_key").using(
      "btree",
      table.postCode.asc().nullsLast().op("text_ops"),
    ),
    index("sys_post_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
  ],
);

export const sysConfig = pgTable(
  "sys_config",
  {
    id: serial().primaryKey().notNull(),
    configKey: varchar({ length: 100 }).notNull(),
    configValue: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 500 }).default("").notNull(),
    status: smallint().default(1).notNull(),
    createdAt: timestamp({ mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    deletedAt: timestamp({ mode: "string" }),
    createdBy: integer(),
    updatedBy: integer(),
    deletedBy: integer(),
  },
  (table) => [
    index("sys_config_configKey_idx").using(
      "btree",
      table.configKey.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("sys_config_configKey_key").using(
      "btree",
      table.configKey.asc().nullsLast().op("text_ops"),
    ),
    index("sys_config_status_idx").using("btree", table.status.asc().nullsLast().op("int2_ops")),
  ],
);

export const sysUserRole = pgTable(
  "sys_user_role",
  {
    userId: integer().notNull(),
    roleId: integer().notNull(),
  },
  (table) => [
    index("sys_user_role_roleId_idx").using("btree", table.roleId.asc().nullsLast().op("int4_ops")),
    index("sys_user_role_userId_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [sysUser.id],
      name: "sys_user_role_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [sysRole.id],
      name: "sys_user_role_roleId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({ columns: [table.userId, table.roleId], name: "sys_user_role_pkey" }),
  ],
);

export const sysRolePermission = pgTable(
  "sys_role_permission",
  {
    roleId: integer().notNull(),
    permissionId: integer().notNull(),
  },
  (table) => [
    index("sys_role_permission_permissionId_idx").using(
      "btree",
      table.permissionId.asc().nullsLast().op("int4_ops"),
    ),
    index("sys_role_permission_roleId_idx").using(
      "btree",
      table.roleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [sysRole.id],
      name: "sys_role_permission_roleId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [sysPermission.id],
      name: "sys_role_permission_permissionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({ columns: [table.roleId, table.permissionId], name: "sys_role_permission_pkey" }),
  ],
);
