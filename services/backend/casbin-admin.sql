

create table sys_role
(
    id           serial
        primary key,
    "roleName"   varchar(50)                                not null,
    "roleCode"   varchar(50)                                not null,
    "createdAt"  timestamp    default CURRENT_TIMESTAMP     not null,
    "createdBy"  integer,
    "deletedBy"  integer,
    "deletedAt"  timestamp,
    "updatedAt"  timestamp                                  not null,
    "updatedBy"  integer,
    description  varchar(500) default ''::character varying not null,
    status       smallint     default 1                     not null,
    custom_depts integer[]    default ARRAY []::integer[],
    data_scope   "DataScope"  default 'DEPT'::"DataScope"   not null
);

alter table sys_role
    owner to postgres;

create unique index "sys_role_roleCode_key"
    on sys_role ("roleCode");

create index "sys_role_roleCode_idx"
    on sys_role ("roleCode");

create table sys_permission
(
    id             serial
        primary key,
    "permName"     varchar(50)  default ''::character varying not null,
    "permCode"     varchar(50)  default ''::character varying not null,
    method         varchar(50)  default ''::character varying not null,
    path           varchar(500) default ''::character varying not null,
    "createdAt"    timestamp    default CURRENT_TIMESTAMP     not null,
    "createdBy"    integer,
    "deletedBy"    integer,
    "deletedAt"    timestamp,
    "updatedAt"    timestamp                                  not null,
    "updatedBy"    integer,
    cache          smallint     default 0                     not null,
    hidden         smallint     default 0                     not null,
    icon           varchar(500) default ''::character varying not null,
    sort           integer      default 0                     not null,
    status         smallint     default 1                     not null,
    "resourceType" "ResourceType",
    "menuType"     "MenuType",
    "parentId"     integer      default 0,
    component      varchar(500) default ''::character varying not null,
    "frameUrl"     varchar(500) default ''::character varying not null
);

alter table sys_permission
    owner to postgres;

create unique index "sys_permission_permCode_key"
    on sys_permission ("permCode");

create index "sys_permission_permCode_idx"
    on sys_permission ("permCode");

create index sys_permission_method_path_idx
    on sys_permission (method, path);

create index "sys_permission_resourceType_idx"
    on sys_permission ("resourceType");

create table sys_role_permission
(
    "roleId"       integer not null
        references sys_role
            on update cascade on delete cascade,
    "permissionId" integer not null
        references sys_permission
            on update cascade on delete cascade,
    primary key ("roleId", "permissionId")
);

alter table sys_role_permission
    owner to postgres;

create index "sys_role_permission_roleId_idx"
    on sys_role_permission ("roleId");

create index "sys_role_permission_permissionId_idx"
    on sys_role_permission ("permissionId");

create table sys_file
(
    id             serial
        primary key,
    filename       varchar(255)                          not null,
    "originalName" varchar(500)                          not null,
    size           integer                               not null,
    mimetype       varchar(100)                          not null,
    path           varchar(500)                          not null,
    extension      varchar(20)                           not null,
    "fileType"     "FileType" default 'FILE'::"FileType" not null,
    "isPublic"     boolean    default false              not null,
    status         smallint   default 1                  not null,
    "createdAt"    timestamp  default CURRENT_TIMESTAMP  not null,
    "updatedAt"    timestamp                             not null,
    "deletedAt"    timestamp,
    "createdBy"    integer,
    "updatedBy"    integer,
    "deletedBy"    integer,
    "businessId"   integer,
    "businessType" varchar(100)
);

alter table sys_file
    owner to postgres;

create index sys_file_filename_idx
    on sys_file (filename);

create index "sys_file_fileType_idx"
    on sys_file ("fileType");

create index sys_file_status_idx
    on sys_file (status);

create unique index sys_file_filename_key
    on sys_file (filename);

create index "sys_file_businessId_idx"
    on sys_file ("businessId");

create index "sys_file_businessType_idx"
    on sys_file ("businessType");

create table sys_timer
(
    id          serial
        primary key,
    name        varchar(100)                          not null,
    description varchar(500),
    cron        varchar(50)                           not null,
    "taskType"  "TaskType" default 'HTTP'::"TaskType" not null,
    target      varchar(1000)                         not null,
    params      jsonb,
    status      smallint   default 1                  not null,
    "lastRunAt" timestamp,
    "nextRunAt" timestamp,
    "createdAt" timestamp  default CURRENT_TIMESTAMP  not null,
    "updatedAt" timestamp                             not null,
    "deletedAt" timestamp,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);

alter table sys_timer
    owner to postgres;

create index sys_timer_status_idx
    on sys_timer (status);

create index "sys_timer_createdAt_idx"
    on sys_timer ("createdAt");

create table sys_timer_execution_log
(
    id        serial
        primary key,
    "timerId" integer   not null
        references sys_timer
            on update cascade on delete cascade,
    status    smallint  not null,
    "startAt" timestamp not null,
    "endAt"   timestamp,
    duration  integer,
    result    text
);

alter table sys_timer_execution_log
    owner to postgres;

create index "sys_timer_execution_log_timerId_idx"
    on sys_timer_execution_log ("timerId");

create index "sys_timer_execution_log_startAt_idx"
    on sys_timer_execution_log ("startAt");

create table sys_dict_type
(
    id          serial
        primary key,
    "dictName"  varchar(100)                               not null,
    "dictCode"  varchar(100)                               not null,
    description varchar(500) default ''::character varying not null,
    status      smallint     default 1                     not null,
    "createdAt" timestamp    default CURRENT_TIMESTAMP     not null,
    "updatedAt" timestamp                                  not null,
    "deletedAt" timestamp,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);

alter table sys_dict_type
    owner to postgres;

create unique index "sys_dict_type_dictCode_key"
    on sys_dict_type ("dictCode");

create index "sys_dict_type_dictCode_idx"
    on sys_dict_type ("dictCode");

create index sys_dict_type_status_idx
    on sys_dict_type (status);

create table sys_dict_item
(
    id           serial
        primary key,
    "dictTypeId" integer                                   not null
        references sys_dict_type
            on update cascade on delete cascade,
    label        varchar(100)                              not null,
    value        varchar(100)                              not null,
    "colorType"  varchar(50) default ''::character varying not null,
    sort         integer     default 0                     not null,
    status       smallint    default 1                     not null,
    "createdAt"  timestamp   default CURRENT_TIMESTAMP     not null,
    "updatedAt"  timestamp                                 not null,
    "deletedAt"  timestamp,
    "createdBy"  integer,
    "updatedBy"  integer,
    "deletedBy"  integer
);

alter table sys_dict_item
    owner to postgres;

create index "sys_dict_item_dictTypeId_idx"
    on sys_dict_item ("dictTypeId");

create index sys_dict_item_sort_idx
    on sys_dict_item (sort);

create index sys_dict_item_status_idx
    on sys_dict_item (status);

create table sys_operation_log
(
    id          serial
        primary key,
    "userId"    integer,
    username    varchar(50)                                     not null,
    module      varchar(50)                                     not null,
    operation   "LogOperation" default 'CREATE'::"LogOperation" not null,
    description varchar(500),
    method      varchar(10)                                     not null,
    path        varchar(200)                                    not null,
    params      jsonb,
    ip          varchar(50),
    "userAgent" varchar(500),
    status      smallint       default 1                        not null,
    result      text,
    duration    integer,
    "createdAt" timestamp      default CURRENT_TIMESTAMP        not null
);

alter table sys_operation_log
    owner to postgres;

create index "sys_operation_log_userId_idx"
    on sys_operation_log ("userId");

create index sys_operation_log_module_idx
    on sys_operation_log (module);

create index sys_operation_log_operation_idx
    on sys_operation_log (operation);

create index "sys_operation_log_createdAt_idx"
    on sys_operation_log ("createdAt");

create table sys_post
(
    id          serial
        primary key,
    "postName"  varchar(50)                         not null,
    "postCode"  varchar(50)                         not null,
    sort        integer   default 0                 not null,
    status      smallint  default 1                 not null,
    remark      varchar(500),
    "createdAt" timestamp default CURRENT_TIMESTAMP not null,
    "updatedAt" timestamp                           not null,
    "deletedAt" timestamp,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);

alter table sys_post
    owner to postgres;

create table sys_user
(
    id          serial
        primary key,
    username    varchar(50)                                not null,
    password    varchar(500)                               not null,
    "createdAt" timestamp    default CURRENT_TIMESTAMP     not null,
    "createdBy" integer,
    "deletedBy" integer,
    "deletedAt" timestamp,
    "updatedAt" timestamp                                  not null,
    "updatedBy" integer,
    avatar      varchar(500) default ''::character varying not null,
    email       varchar(100) default ''::character varying not null,
    gender      smallint     default 0                     not null,
    mobile      varchar(18)  default ''::character varying not null,
    nickname    varchar(50)  default ''::character varying not null,
    status      smallint     default 1                     not null,
    dept_id     integer,
    is_admin    boolean      default false                 not null,
    post_id     integer
                                                           references sys_post
                                                               on update cascade on delete set null
);

alter table sys_user
    owner to postgres;

create unique index sys_user_username_key
    on sys_user (username);

create index sys_user_username_idx
    on sys_user (username);

create index sys_user_mobile_idx
    on sys_user (mobile);

create index sys_user_email_idx
    on sys_user (email);

create index sys_user_dept_id_idx
    on sys_user (dept_id);

create index sys_user_post_id_idx
    on sys_user (post_id);

create table sys_user_role
(
    "userId" integer not null
        references sys_user
            on update cascade on delete cascade,
    "roleId" integer not null
        references sys_role
            on update cascade on delete cascade,
    primary key ("userId", "roleId")
);

alter table sys_user_role
    owner to postgres;

create index "sys_user_role_userId_idx"
    on sys_user_role ("userId");

create index "sys_user_role_roleId_idx"
    on sys_user_role ("roleId");

create table sys_login_log
(
    id          serial
        primary key,
    "userId"    integer
                                                    references sys_user
                                                        on update cascade on delete set null,
    username    varchar(50)                         not null,
    ip          varchar(50),
    "userAgent" varchar(500),
    status      smallint  default 1                 not null,
    message     varchar(200),
    "createdAt" timestamp default CURRENT_TIMESTAMP not null
);

alter table sys_login_log
    owner to postgres;

create index "sys_login_log_userId_idx"
    on sys_login_log ("userId");

create index sys_login_log_username_idx
    on sys_login_log (username);

create index "sys_login_log_createdAt_idx"
    on sys_login_log ("createdAt");

create table sys_dept
(
    id          serial
        primary key,
    name        varchar(50)                            not null,
    parent_id   integer
                                                       references sys_dept
                                                           on update cascade on delete set null,
    ancestors   text,
    leader_id   integer
                                                       references sys_user
                                                           on update cascade on delete set null,
    status      smallint     default 1                 not null,
    sort        integer      default 0                 not null,
    remark      varchar(500),
    created_at  timestamp(3) default CURRENT_TIMESTAMP not null,
    updated_at  timestamp(3)                           not null,
    deleted_at  timestamp(3),
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);

alter table sys_dept
    owner to postgres;

alter table sys_user
    add foreign key (dept_id) references sys_dept
        on update cascade on delete set null;

create index sys_dept_parent_id_idx
    on sys_dept (parent_id);

create index sys_dept_ancestors_idx
    on sys_dept (ancestors);

create index sys_dept_status_idx
    on sys_dept (status);

create unique index "sys_post_postCode_key"
    on sys_post ("postCode");

create index "sys_post_postCode_idx"
    on sys_post ("postCode");

create index sys_post_status_idx
    on sys_post (status);

create table sys_config
(
    id            serial
        primary key,
    "configKey"   varchar(100)                               not null,
    "configValue" varchar(500)                               not null,
    description   varchar(500) default ''::character varying not null,
    status        smallint     default 1                     not null,
    "createdAt"   timestamp    default CURRENT_TIMESTAMP     not null,
    "updatedAt"   timestamp                                  not null,
    "deletedAt"   timestamp,
    "createdBy"   integer,
    "updatedBy"   integer,
    "deletedBy"   integer
);

alter table sys_config
    owner to postgres;

create unique index "sys_config_configKey_key"
    on sys_config ("configKey");

create index "sys_config_configKey_idx"
    on sys_config ("configKey");

create index sys_config_status_idx
    on sys_config (status);

INSERT INTO public.sys_config (id, "configKey", "configValue", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (1, 'FILING', 'xxx', '备案信息', 1, '2026-03-06 02:44:09.878000', '2026-03-06 05:10:20.199000', null, null, null, null);
INSERT INTO public.sys_dept (id, name, parent_id, ancestors, leader_id, status, sort, remark, created_at, updated_at, deleted_at, "createdBy", "updatedBy", "deletedBy") VALUES (1, '风策集团', null, '0', null, 1, 0, '', '2026-03-04 02:05:36.381', '2026-03-04 02:05:36.381', null, 1, null, null);
INSERT INTO public.sys_dept (id, name, parent_id, ancestors, leader_id, status, sort, remark, created_at, updated_at, deleted_at, "createdBy", "updatedBy", "deletedBy") VALUES (2, '上海风策网络有限公司', 1, '0,1', null, 1, 0, '', '2026-03-04 02:06:00.928', '2026-03-04 02:06:00.928', null, 1, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (1, 1, '正常', '1', '', 0, 1, '2026-02-19 01:44:12.332000', '2026-02-19 01:44:12.332000', null, null, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (2, 1, '禁用', '0', '', 0, 1, '2026-02-19 01:44:20.075000', '2026-02-19 01:44:20.075000', null, null, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (3, 3, '菜单', 'menu', '', 0, 1, '2026-02-24 09:13:53.743000', '2026-02-24 09:13:53.743000', null, null, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (4, 3, '接口', 'api', '', 0, 1, '2026-02-24 09:14:06.307000', '2026-02-24 09:14:06.307000', null, null, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (5, 3, '按钮', 'button', '', 0, 1, '2026-02-24 09:14:15.321000', '2026-02-24 09:14:15.321000', null, null, null, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (6, 2, '菜单', 'menu', '', 1, 1, '2026-02-24 09:14:47.935000', '2026-02-24 09:40:14.099000', null, null, 1, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (7, 2, '页面', 'page', '', 2, 1, '2026-02-24 09:14:59.228000', '2026-02-24 09:40:20.879000', null, null, 1, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (8, 2, '外链', 'link', '', 3, 1, '2026-02-24 09:15:08.777000', '2026-02-24 09:40:31.369000', null, null, 1, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (9, 2, '内链', 'iframe', '', 4, 1, '2026-02-24 09:15:33.884000', '2026-02-24 09:40:35.239000', null, null, 1, null);
INSERT INTO public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (10, 2, '新窗口', 'window', '', 5, 1, '2026-02-24 09:16:00.595000', '2026-02-24 09:40:40.527000', null, null, 1, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (1, '基础状态', 'BASE_STATUS', '', 1, '2026-02-18 18:10:16.000000', '2026-02-18 18:10:19.000000', null, 1, 1, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (2, '菜单类型', 'MENU_TYPE', '', 1, '2026-02-24 09:12:55.523000', '2026-02-24 09:12:55.523000', null, null, null, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (3, '权限类型', 'RESOURCE_TYPE', '', 1, '2026-02-24 09:13:29.719000', '2026-02-24 09:13:29.719000', null, null, null, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (4, '是否', 'YES_NO', '', 1, '2026-02-26 13:29:04.000000', '2026-02-26 13:29:07.000000', null, 1, 1, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (5, '定时任务类型', 'TASK_TYPE', '', 1, '2026-03-04 06:20:43.741000', '2026-03-04 06:22:02.204000', null, 1, 1, null);
INSERT INTO public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (6, '文件类型', 'FILE_TYPE', '', 1, '2026-03-06 01:49:33.957000', '2026-03-06 01:49:33.957000', null, 1, 1, null);
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (7, '系统设置', 'System', '', '/system', '2026-02-26 10:18:44.000000', 1, null, null, '2026-03-05 09:49:24.966000', 1, 0, 0, 'material:SettingsFilled', 2, 1, 'menu', 'menu', null, '', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (43, '删除', 'DEPT_DELETE', '', '', '2026-03-12 12:54:04.996000', 1, null, null, '2026-03-12 12:54:04.996000', 1, 0, 0, '', 0, 1, 'button', null, 17, '', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (2, '工作台', 'Workbench', '', '/dashboard/workbench', '2026-02-23 16:18:20.000000', 1, null, null, '2026-02-23 16:18:26.000000', 1, 1, 0, '', 1, 1, 'menu', 'page', 1, 'dashboard/workbench/index', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (25, '权限中心', 'Permission', '', '/permission', '2026-03-05 09:47:22.446000', 1, null, null, '2026-03-05 09:49:39.819000', 1, 1, 0, 'material:HealthAndSafetyOutlined', 1, 1, 'menu', 'menu', null, '', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (44, '新增', 'DICT_ADD', '', '', '2026-03-12 12:55:38.615000', 1, null, null, '2026-03-12 12:55:38.615000', 1, 0, 0, '', 0, 1, 'button', null, 11, '', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (26, '系统配置', 'Config', '', '/system/config', '2026-03-06 02:41:33.050000', 1, null, null, '2026-03-06 02:41:33.050000', 1, 1, 0, 'material:SettingsOutlined', 0, 1, 'menu', 'page', 7, 'system/config/index', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (3, '监控页', 'Monitor', '', '/dashboard/monitor', '2026-02-24 10:37:45.000000', 1, null, null, '2026-02-24 10:37:58.000000', 1, 1, 0, '', 2, 1, 'menu', 'page', 1, 'dashboard/monitor/index', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (27, '新增', 'USER_ADD', '', '', '2026-03-12 05:35:55.452000', 1, null, null, '2026-03-12 05:35:55.452000', 1, 0, 0, '', 0, 1, 'button', null, 9, '', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (4, 'Landing-测试window类型', 'Landing', '', '/landing', '2026-02-25 17:12:22.000000', 1, null, null, '2026-03-12 08:18:57.696000', 1, 0, 0, 'material:CropLandscapeFilled', 1, 1, 'menu', 'window', 5, 'pages/landing/index', '');
INSERT INTO public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") VALUES (12, '功能测试', 'FuncTest', '', '/funcTest', '2026-03-02 05:28:14.442000', 1, null, null, '2026-03-12 08:34:20.656000', 1, 1, 0, 'material:TipsAndUpdatesTwotone', 3, 1, 'menu', 'menu', null, '', '');

INSERT INTO public.sys_post (id, "postName", "postCode", sort, status, remark, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (1, '董事长', 'Chairman', 0, 1, '', '2026-03-05 02:12:52.207000', '2026-03-10 02:33:04.535000', null, null, null, null);
INSERT INTO public.sys_post (id, "postName", "postCode", sort, status, remark, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") VALUES (2, '总经理', 'CEO', 1, 1, '', '2026-03-10 02:33:18.613000', '2026-03-10 02:33:18.613000', null, null, null, null);
INSERT INTO public.sys_role (id, "roleName", "roleCode", "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", description, status, custom_depts, data_scope) VALUES (1, '超级管理员', 'super_admin', '2026-02-09 09:42:45.688000', 1, null, null, '2026-02-09 09:42:45.688000', 1, '超级管理员', 1, '{}', 'DEPT');
INSERT INTO public.sys_role (id, "roleName", "roleCode", "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", description, status, custom_depts, data_scope) VALUES (2, '测试角色1', 'test1', '2026-03-12 02:58:02.092000', 1, null, null, '2026-03-12 02:58:02.092000', 1, '', 1, '{}', 'DEPT');
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 48);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 1);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 2);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 3);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 4);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 5);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 6);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 7);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 8);
INSERT INTO public.sys_role_permission ("roleId", "permissionId") VALUES (1, 9);
INSERT INTO public.sys_user (id, username, password, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", avatar, email, gender, mobile, nickname, status, dept_id, is_admin, post_id) VALUES (1, 'admin', '$2b$10$A1IxNzXhrn8bZ67zlskCQut1aBRQkpU3kWSf8khwgxa/ELZgYGSJq', '2026-02-09 06:16:04.232000', null, null, null, '2026-03-04 06:32:47.725000', 1, 'http://localhost:8080/uploads/1772264302055-tlosxd.jpg', '176620731742163.com', 0, '17662073174', 'admin', 1, 1, true, null);
INSERT INTO public.sys_user_role ("userId", "roleId") VALUES (1, 1);
