-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."DataScope" AS ENUM('ALL', 'CUSTOM', 'DEPT', 'DEPT_AND_CHILD');--> statement-breakpoint
CREATE TYPE "public"."FileType" AS ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'FILE');--> statement-breakpoint
CREATE TYPE "public"."LogOperation" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."MenuType" AS ENUM('menu', 'page', 'link', 'iframe', 'window', 'divider', 'group');--> statement-breakpoint
CREATE TYPE "public"."ResourceType" AS ENUM('menu', 'api', 'button');--> statement-breakpoint
CREATE TYPE "public"."TaskType" AS ENUM('HTTP', 'SCRIPT');--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"name" text PRIMARY KEY NOT NULL,
	"checksum" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_permission" (
	"id" serial PRIMARY KEY NOT NULL,
	"permName" varchar(50) DEFAULT '' NOT NULL,
	"permCode" varchar(50) DEFAULT '' NOT NULL,
	"method" varchar(50) DEFAULT '' NOT NULL,
	"path" varchar(500) DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" integer,
	"deletedBy" integer,
	"deletedAt" timestamp,
	"updatedAt" timestamp NOT NULL,
	"updatedBy" integer,
	"cache" smallint DEFAULT 0 NOT NULL,
	"hidden" smallint DEFAULT 0 NOT NULL,
	"icon" varchar(500) DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"resourceType" "ResourceType",
	"menuType" "MenuType",
	"parentId" integer DEFAULT 0,
	"component" varchar(500) DEFAULT '' NOT NULL,
	"frameUrl" varchar(500) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"roleName" varchar(50) NOT NULL,
	"roleCode" varchar(50) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" integer,
	"deletedBy" integer,
	"deletedAt" timestamp,
	"updatedAt" timestamp NOT NULL,
	"updatedBy" integer,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"custom_depts" integer[] DEFAULT '{RAY}',
	"data_scope" "DataScope" DEFAULT 'DEPT' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_file" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"originalName" varchar(500) NOT NULL,
	"size" integer NOT NULL,
	"mimetype" varchar(100) NOT NULL,
	"path" varchar(500) NOT NULL,
	"extension" varchar(20) NOT NULL,
	"fileType" "FileType" DEFAULT 'FILE' NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer,
	"businessId" integer,
	"businessType" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "sys_login_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"username" varchar(50) NOT NULL,
	"ip" varchar(50),
	"userAgent" varchar(500),
	"status" smallint DEFAULT 1 NOT NULL,
	"message" varchar(200),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_timer" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"cron" varchar(50) NOT NULL,
	"taskType" "TaskType" DEFAULT 'HTTP' NOT NULL,
	"target" varchar(1000) NOT NULL,
	"params" jsonb,
	"status" smallint DEFAULT 1 NOT NULL,
	"lastRunAt" timestamp,
	"nextRunAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_timer_execution_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"timerId" integer NOT NULL,
	"status" smallint NOT NULL,
	"startAt" timestamp NOT NULL,
	"endAt" timestamp,
	"duration" integer,
	"result" text
);
--> statement-breakpoint
CREATE TABLE "sys_dict_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"dictName" varchar(100) NOT NULL,
	"dictCode" varchar(100) NOT NULL,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_dict_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"dictTypeId" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"value" varchar(100) NOT NULL,
	"colorType" varchar(50) DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_operation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"username" varchar(50) NOT NULL,
	"module" varchar(50) NOT NULL,
	"operation" "LogOperation" DEFAULT 'CREATE' NOT NULL,
	"description" varchar(500),
	"method" varchar(10) NOT NULL,
	"path" varchar(200) NOT NULL,
	"params" jsonb,
	"ip" varchar(50),
	"userAgent" varchar(500),
	"status" smallint DEFAULT 1 NOT NULL,
	"result" text,
	"duration" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_dept" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"parent_id" integer,
	"ancestors" text,
	"leader_id" integer,
	"status" smallint DEFAULT 1 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"remark" varchar(500),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"deletedAt" timestamp(3),
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(500) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" integer,
	"deletedBy" integer,
	"deletedAt" timestamp,
	"updatedAt" timestamp NOT NULL,
	"updatedBy" integer,
	"avatar" varchar(500) DEFAULT '' NOT NULL,
	"email" varchar(100) DEFAULT '' NOT NULL,
	"gender" smallint DEFAULT 0 NOT NULL,
	"mobile" varchar(18) DEFAULT '' NOT NULL,
	"nickname" varchar(50) DEFAULT '' NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"dept_id" integer,
	"is_admin" boolean DEFAULT false NOT NULL,
	"post_id" integer
);
--> statement-breakpoint
CREATE TABLE "sys_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"postName" varchar(50) NOT NULL,
	"postCode" varchar(50) NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"remark" varchar(500),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"configKey" varchar(100) NOT NULL,
	"configValue" varchar(500) NOT NULL,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp,
	"createdBy" integer,
	"updatedBy" integer,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "sys_user_role" (
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	CONSTRAINT "sys_user_role_pkey" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "sys_role_permission" (
	"roleId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY("roleId","permissionId")
);
--> statement-breakpoint
ALTER TABLE "sys_login_log" ADD CONSTRAINT "sys_login_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."sys_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_timer_execution_log" ADD CONSTRAINT "sys_timer_execution_log_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "public"."sys_timer"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_dict_item" ADD CONSTRAINT "sys_dict_item_dictTypeId_fkey" FOREIGN KEY ("dictTypeId") REFERENCES "public"."sys_dict_type"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_dept" ADD CONSTRAINT "sys_dept_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."sys_dept"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_dept" ADD CONSTRAINT "sys_dept_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."sys_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_user" ADD CONSTRAINT "sys_user_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "public"."sys_dept"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_user" ADD CONSTRAINT "sys_user_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."sys_post"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."sys_user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."sys_role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."sys_role"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."sys_permission"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "sys_permission_method_path_idx" ON "sys_permission" USING btree ("method" text_ops,"path" text_ops);--> statement-breakpoint
CREATE INDEX "sys_permission_permCode_idx" ON "sys_permission" USING btree ("permCode" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_permission_permCode_key" ON "sys_permission" USING btree ("permCode" text_ops);--> statement-breakpoint
CREATE INDEX "sys_permission_resourceType_idx" ON "sys_permission" USING btree ("resourceType" enum_ops);--> statement-breakpoint
CREATE INDEX "sys_role_roleCode_idx" ON "sys_role" USING btree ("roleCode" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_role_roleCode_key" ON "sys_role" USING btree ("roleCode" text_ops);--> statement-breakpoint
CREATE INDEX "sys_file_businessId_idx" ON "sys_file" USING btree ("businessId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_file_businessType_idx" ON "sys_file" USING btree ("businessType" text_ops);--> statement-breakpoint
CREATE INDEX "sys_file_fileType_idx" ON "sys_file" USING btree ("fileType" enum_ops);--> statement-breakpoint
CREATE INDEX "sys_file_filename_idx" ON "sys_file" USING btree ("filename" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_file_filename_key" ON "sys_file" USING btree ("filename" text_ops);--> statement-breakpoint
CREATE INDEX "sys_file_status_idx" ON "sys_file" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_login_log_createdAt_idx" ON "sys_login_log" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "sys_login_log_userId_idx" ON "sys_login_log" USING btree ("userId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_login_log_username_idx" ON "sys_login_log" USING btree ("username" text_ops);--> statement-breakpoint
CREATE INDEX "sys_timer_createdAt_idx" ON "sys_timer" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "sys_timer_status_idx" ON "sys_timer" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_timer_execution_log_startAt_idx" ON "sys_timer_execution_log" USING btree ("startAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "sys_timer_execution_log_timerId_idx" ON "sys_timer_execution_log" USING btree ("timerId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_dict_type_dictCode_idx" ON "sys_dict_type" USING btree ("dictCode" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_dict_type_dictCode_key" ON "sys_dict_type" USING btree ("dictCode" text_ops);--> statement-breakpoint
CREATE INDEX "sys_dict_type_status_idx" ON "sys_dict_type" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_dict_item_dictTypeId_idx" ON "sys_dict_item" USING btree ("dictTypeId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_dict_item_sort_idx" ON "sys_dict_item" USING btree ("sort" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_dict_item_status_idx" ON "sys_dict_item" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_operation_log_createdAt_idx" ON "sys_operation_log" USING btree ("createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "sys_operation_log_module_idx" ON "sys_operation_log" USING btree ("module" text_ops);--> statement-breakpoint
CREATE INDEX "sys_operation_log_operation_idx" ON "sys_operation_log" USING btree ("operation" enum_ops);--> statement-breakpoint
CREATE INDEX "sys_operation_log_userId_idx" ON "sys_operation_log" USING btree ("userId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_dept_ancestors_idx" ON "sys_dept" USING btree ("ancestors" text_ops);--> statement-breakpoint
CREATE INDEX "sys_dept_parent_id_idx" ON "sys_dept" USING btree ("parent_id" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_dept_status_idx" ON "sys_dept" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_user_dept_id_idx" ON "sys_user" USING btree ("dept_id" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_user_email_idx" ON "sys_user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "sys_user_mobile_idx" ON "sys_user" USING btree ("mobile" text_ops);--> statement-breakpoint
CREATE INDEX "sys_user_post_id_idx" ON "sys_user" USING btree ("post_id" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_user_username_idx" ON "sys_user" USING btree ("username" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_user_username_key" ON "sys_user" USING btree ("username" text_ops);--> statement-breakpoint
CREATE INDEX "sys_post_postCode_idx" ON "sys_post" USING btree ("postCode" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_post_postCode_key" ON "sys_post" USING btree ("postCode" text_ops);--> statement-breakpoint
CREATE INDEX "sys_post_status_idx" ON "sys_post" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_config_configKey_idx" ON "sys_config" USING btree ("configKey" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sys_config_configKey_key" ON "sys_config" USING btree ("configKey" text_ops);--> statement-breakpoint
CREATE INDEX "sys_config_status_idx" ON "sys_config" USING btree ("status" int2_ops);--> statement-breakpoint
CREATE INDEX "sys_user_role_roleId_idx" ON "sys_user_role" USING btree ("roleId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_user_role_userId_idx" ON "sys_user_role" USING btree ("userId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_role_permission_permissionId_idx" ON "sys_role_permission" USING btree ("permissionId" int4_ops);--> statement-breakpoint
CREATE INDEX "sys_role_permission_roleId_idx" ON "sys_role_permission" USING btree ("roleId" int4_ops);
*/