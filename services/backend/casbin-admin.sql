--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DataScope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DataScope" AS ENUM (
    'ALL',
    'CUSTOM',
    'DEPT',
    'DEPT_AND_CHILD'
);


ALTER TYPE public."DataScope" OWNER TO postgres;

--
-- Name: FileType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FileType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'ARCHIVE',
    'FILE'
);


ALTER TYPE public."FileType" OWNER TO postgres;

--
-- Name: LogOperation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LogOperation" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);


ALTER TYPE public."LogOperation" OWNER TO postgres;

--
-- Name: MenuType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MenuType" AS ENUM (
    'menu',
    'page',
    'link',
    'iframe',
    'window',
    'divider',
    'group'
);


ALTER TYPE public."MenuType" OWNER TO postgres;

--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ResourceType" AS ENUM (
    'menu',
    'api',
    'button'
);


ALTER TYPE public."ResourceType" OWNER TO postgres;

--
-- Name: TaskType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskType" AS ENUM (
    'HTTP',
    'SCRIPT'
);


ALTER TYPE public."TaskType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: sys_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_config (
    id integer NOT NULL,
    "configKey" character varying(100) NOT NULL,
    "configValue" character varying(500) NOT NULL,
    description character varying(500) DEFAULT ''::character varying NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_config OWNER TO postgres;

--
-- Name: sys_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_config_id_seq OWNER TO postgres;

--
-- Name: sys_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_config_id_seq OWNED BY public.sys_config.id;


--
-- Name: sys_dept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_dept (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    parent_id integer,
    ancestors text,
    leader_id integer,
    status smallint DEFAULT 1 NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    remark character varying(500),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_dept OWNER TO postgres;

--
-- Name: sys_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_dept_id_seq OWNER TO postgres;

--
-- Name: sys_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_dept_id_seq OWNED BY public.sys_dept.id;


--
-- Name: sys_dict_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_dict_item (
    id integer NOT NULL,
    "dictTypeId" integer NOT NULL,
    label character varying(100) NOT NULL,
    value character varying(100) NOT NULL,
    "colorType" character varying(50) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_dict_item OWNER TO postgres;

--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_dict_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_dict_item_id_seq OWNER TO postgres;

--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_dict_item_id_seq OWNED BY public.sys_dict_item.id;


--
-- Name: sys_dict_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_dict_type (
    id integer NOT NULL,
    "dictName" character varying(100) NOT NULL,
    "dictCode" character varying(100) NOT NULL,
    description character varying(500) DEFAULT ''::character varying NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_dict_type OWNER TO postgres;

--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_dict_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_dict_type_id_seq OWNER TO postgres;

--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_dict_type_id_seq OWNED BY public.sys_dict_type.id;


--
-- Name: sys_file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_file (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    "originalName" character varying(500) NOT NULL,
    size integer NOT NULL,
    mimetype character varying(100) NOT NULL,
    path character varying(500) NOT NULL,
    extension character varying(20) NOT NULL,
    "fileType" public."FileType" DEFAULT 'FILE'::public."FileType" NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer,
    "businessId" integer,
    "businessType" character varying(100)
);


ALTER TABLE public.sys_file OWNER TO postgres;

--
-- Name: sys_file_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_file_id_seq OWNER TO postgres;

--
-- Name: sys_file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_file_id_seq OWNED BY public.sys_file.id;


--
-- Name: sys_login_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_login_log (
    id integer NOT NULL,
    "userId" integer,
    username character varying(50) NOT NULL,
    ip character varying(50),
    "userAgent" character varying(500),
    status smallint DEFAULT 1 NOT NULL,
    message character varying(200),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sys_login_log OWNER TO postgres;

--
-- Name: sys_login_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_login_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_login_log_id_seq OWNER TO postgres;

--
-- Name: sys_login_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_login_log_id_seq OWNED BY public.sys_login_log.id;


--
-- Name: sys_operation_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_operation_log (
    id integer NOT NULL,
    "userId" integer,
    username character varying(50) NOT NULL,
    module character varying(50) NOT NULL,
    operation public."LogOperation" DEFAULT 'CREATE'::public."LogOperation" NOT NULL,
    description character varying(500),
    method character varying(10) NOT NULL,
    path character varying(200) NOT NULL,
    params jsonb,
    ip character varying(50),
    "userAgent" character varying(500),
    status smallint DEFAULT 1 NOT NULL,
    result text,
    duration integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sys_operation_log OWNER TO postgres;

--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_operation_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_operation_log_id_seq OWNER TO postgres;

--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_operation_log_id_seq OWNED BY public.sys_operation_log.id;


--
-- Name: sys_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_permission (
    id integer NOT NULL,
    "permName" character varying(50) DEFAULT ''::character varying NOT NULL,
    "permCode" character varying(50) DEFAULT ''::character varying NOT NULL,
    method character varying(50) DEFAULT ''::character varying NOT NULL,
    path character varying(500) DEFAULT ''::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" integer,
    "deletedBy" integer,
    "deletedAt" timestamp without time zone,
    "updatedAt" timestamp without time zone NOT NULL,
    "updatedBy" integer,
    cache smallint DEFAULT 0 NOT NULL,
    hidden smallint DEFAULT 0 NOT NULL,
    icon character varying(500) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "resourceType" public."ResourceType",
    "menuType" public."MenuType",
    "parentId" integer DEFAULT 0,
    component character varying(500) DEFAULT ''::character varying NOT NULL,
    "frameUrl" character varying(500) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.sys_permission OWNER TO postgres;

--
-- Name: sys_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_permission_id_seq OWNER TO postgres;

--
-- Name: sys_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_permission_id_seq OWNED BY public.sys_permission.id;


--
-- Name: sys_post; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_post (
    id integer NOT NULL,
    "postName" character varying(50) NOT NULL,
    "postCode" character varying(50) NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    remark character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_post OWNER TO postgres;

--
-- Name: sys_post_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_post_id_seq OWNER TO postgres;

--
-- Name: sys_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_post_id_seq OWNED BY public.sys_post.id;


--
-- Name: sys_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_role (
    id integer NOT NULL,
    "roleName" character varying(50) NOT NULL,
    "roleCode" character varying(50) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" integer,
    "deletedBy" integer,
    "deletedAt" timestamp without time zone,
    "updatedAt" timestamp without time zone NOT NULL,
    "updatedBy" integer,
    description character varying(500) DEFAULT ''::character varying NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    custom_depts integer[] DEFAULT ARRAY[]::integer[],
    data_scope public."DataScope" DEFAULT 'DEPT'::public."DataScope" NOT NULL
);


ALTER TABLE public.sys_role OWNER TO postgres;

--
-- Name: sys_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_role_id_seq OWNER TO postgres;

--
-- Name: sys_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_role_id_seq OWNED BY public.sys_role.id;


--
-- Name: sys_role_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_role_permission (
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


ALTER TABLE public.sys_role_permission OWNER TO postgres;

--
-- Name: sys_timer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_timer (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    cron character varying(50) NOT NULL,
    "taskType" public."TaskType" DEFAULT 'HTTP'::public."TaskType" NOT NULL,
    target character varying(1000) NOT NULL,
    params jsonb,
    status smallint DEFAULT 1 NOT NULL,
    "lastRunAt" timestamp without time zone,
    "nextRunAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deletedAt" timestamp without time zone,
    "createdBy" integer,
    "updatedBy" integer,
    "deletedBy" integer
);


ALTER TABLE public.sys_timer OWNER TO postgres;

--
-- Name: sys_timer_execution_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_timer_execution_log (
    id integer NOT NULL,
    "timerId" integer NOT NULL,
    status smallint NOT NULL,
    "startAt" timestamp without time zone NOT NULL,
    "endAt" timestamp without time zone,
    duration integer,
    result text
);


ALTER TABLE public.sys_timer_execution_log OWNER TO postgres;

--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_timer_execution_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_timer_execution_log_id_seq OWNER TO postgres;

--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_timer_execution_log_id_seq OWNED BY public.sys_timer_execution_log.id;


--
-- Name: sys_timer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_timer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_timer_id_seq OWNER TO postgres;

--
-- Name: sys_timer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_timer_id_seq OWNED BY public.sys_timer.id;


--
-- Name: sys_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_user (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(500) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" integer,
    "deletedBy" integer,
    "deletedAt" timestamp without time zone,
    "updatedAt" timestamp without time zone NOT NULL,
    "updatedBy" integer,
    avatar character varying(500) DEFAULT ''::character varying NOT NULL,
    email character varying(100) DEFAULT ''::character varying NOT NULL,
    gender smallint DEFAULT 0 NOT NULL,
    mobile character varying(18) DEFAULT ''::character varying NOT NULL,
    nickname character varying(50) DEFAULT ''::character varying NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    dept_id integer,
    is_admin boolean DEFAULT false NOT NULL,
    post_id integer
);


ALTER TABLE public.sys_user OWNER TO postgres;

--
-- Name: sys_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sys_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_user_id_seq OWNER TO postgres;

--
-- Name: sys_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sys_user_id_seq OWNED BY public.sys_user.id;


--
-- Name: sys_user_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sys_user_role (
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL
);


ALTER TABLE public.sys_user_role OWNER TO postgres;

--
-- Name: sys_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_config ALTER COLUMN id SET DEFAULT nextval('public.sys_config_id_seq'::regclass);


--
-- Name: sys_dept id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dept ALTER COLUMN id SET DEFAULT nextval('public.sys_dept_id_seq'::regclass);


--
-- Name: sys_dict_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dict_item ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_item_id_seq'::regclass);


--
-- Name: sys_dict_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dict_type ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_type_id_seq'::regclass);


--
-- Name: sys_file id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_file ALTER COLUMN id SET DEFAULT nextval('public.sys_file_id_seq'::regclass);


--
-- Name: sys_login_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_login_log ALTER COLUMN id SET DEFAULT nextval('public.sys_login_log_id_seq'::regclass);


--
-- Name: sys_operation_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_operation_log ALTER COLUMN id SET DEFAULT nextval('public.sys_operation_log_id_seq'::regclass);


--
-- Name: sys_permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_permission ALTER COLUMN id SET DEFAULT nextval('public.sys_permission_id_seq'::regclass);


--
-- Name: sys_post id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_post ALTER COLUMN id SET DEFAULT nextval('public.sys_post_id_seq'::regclass);


--
-- Name: sys_role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_role ALTER COLUMN id SET DEFAULT nextval('public.sys_role_id_seq'::regclass);


--
-- Name: sys_timer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_timer ALTER COLUMN id SET DEFAULT nextval('public.sys_timer_id_seq'::regclass);


--
-- Name: sys_timer_execution_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_timer_execution_log ALTER COLUMN id SET DEFAULT nextval('public.sys_timer_execution_log_id_seq'::regclass);


--
-- Name: sys_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user ALTER COLUMN id SET DEFAULT nextval('public.sys_user_id_seq'::regclass);


--
-- Data for Name: sys_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_config (id, "configKey", "configValue", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	FILING	xxx	备案信息	1	2026-03-06 02:44:09.878	2026-03-06 05:10:20.199	\N	\N	\N	\N
\.


--
-- Data for Name: sys_dept; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_dept (id, name, parent_id, ancestors, leader_id, status, sort, remark, created_at, updated_at, "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	风策集团	\N	0	\N	1	0		2026-03-04 02:05:36.381	2026-03-04 02:05:36.381	\N	1	\N	\N
2	上海风策网络有限公司	1	0,1	\N	1	0		2026-03-04 02:06:00.928	2026-03-04 02:06:00.928	\N	1	\N	\N
\.


--
-- Data for Name: sys_dict_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	1	正常	1		0	1	2026-02-19 01:44:12.332	2026-02-19 01:44:12.332	\N	\N	\N	\N
2	1	禁用	0		0	1	2026-02-19 01:44:20.075	2026-02-19 01:44:20.075	\N	\N	\N	\N
3	3	菜单	menu		0	1	2026-02-24 09:13:53.743	2026-02-24 09:13:53.743	\N	\N	\N	\N
4	3	接口	api		0	1	2026-02-24 09:14:06.307	2026-02-24 09:14:06.307	\N	\N	\N	\N
5	3	按钮	button		0	1	2026-02-24 09:14:15.321	2026-02-24 09:14:15.321	\N	\N	\N	\N
6	2	菜单	menu		1	1	2026-02-24 09:14:47.935	2026-02-24 09:40:14.099	\N	\N	1	\N
7	2	页面	page		2	1	2026-02-24 09:14:59.228	2026-02-24 09:40:20.879	\N	\N	1	\N
8	2	外链	link		3	1	2026-02-24 09:15:08.777	2026-02-24 09:40:31.369	\N	\N	1	\N
9	2	内链	iframe		4	1	2026-02-24 09:15:33.884	2026-02-24 09:40:35.239	\N	\N	1	\N
10	2	新窗口	window		5	1	2026-02-24 09:16:00.595	2026-02-24 09:40:40.527	\N	\N	1	\N
12	2	分割线	divider		6	1	2026-02-24 09:17:46.425	2026-02-24 09:40:44.541	\N	\N	1	\N
11	2	分组	group		7	1	2026-02-24 09:16:12.263	2026-02-24 09:40:48.195	\N	\N	1	\N
13	4	是	1	success	1	1	2026-02-26 13:29:42	2026-02-28 07:53:31.604	\N	\N	1	\N
14	4	否	0	error	2	1	2026-02-26 13:30:08	2026-02-28 07:53:37.472	\N	\N	1	\N
15	5	http请求	HTTP		0	1	2026-03-04 06:20:57.2	2026-03-04 06:20:57.2	\N	1	1	\N
16	5	执行脚本	SCRIPT		0	1	2026-03-04 06:21:48.079	2026-03-04 06:21:48.079	\N	1	1	\N
17	6	头像	AVATAR		0	1	2026-03-06 01:49:51.334	2026-03-06 01:49:51.334	\N	1	1	\N
\.


--
-- Data for Name: sys_dict_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	基础状态	BASE_STATUS		1	2026-02-18 18:10:16	2026-02-18 18:10:19	\N	1	1	\N
2	菜单类型	MENU_TYPE		1	2026-02-24 09:12:55.523	2026-02-24 09:12:55.523	\N	\N	\N	\N
3	权限类型	RESOURCE_TYPE		1	2026-02-24 09:13:29.719	2026-02-24 09:13:29.719	\N	\N	\N	\N
4	是否	YES_NO		1	2026-02-26 13:29:04	2026-02-26 13:29:07	\N	1	1	\N
5	定时任务类型	TASK_TYPE		1	2026-03-04 06:20:43.741	2026-03-04 06:22:02.204	\N	1	1	\N
6	文件类型	FILE_TYPE		1	2026-03-06 01:49:33.957	2026-03-06 01:49:33.957	\N	1	1	\N
\.


--
-- Data for Name: sys_file; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_file (id, filename, "originalName", size, mimetype, path, extension, "fileType", "isPublic", status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy", "businessId", "businessType") FROM stdin;
\.


--
-- Data for Name: sys_login_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_login_log (id, "userId", username, ip, "userAgent", status, message, "createdAt") FROM stdin;
95	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-13 06:27:09.515
96	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-16 01:38:23.425
97	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-16 08:08:08.424991
98	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-16 08:27:42.128917
99	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-17 01:47:29.788604
100	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1	\N	2026-03-17 05:25:40.820631
\.


--
-- Data for Name: sys_operation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_operation_log (id, "userId", username, module, operation, description, method, path, params, ip, "userAgent", status, result, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: sys_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") FROM stdin;
7	系统设置	System		/system	2026-02-26 10:18:44	1	\N	\N	2026-03-05 09:49:24.966	1	0	0	material:SettingsFilled	2	1	menu	menu	\N		
43	删除	DEPT_DELETE			2026-03-12 12:54:04.996	1	\N	\N	2026-03-12 12:54:04.996	1	0	0		0	1	button	\N	17		
2	工作台	Workbench		/dashboard/workbench	2026-02-23 16:18:20	1	\N	\N	2026-02-23 16:18:26	1	1	0		1	1	menu	page	1	dashboard/workbench/index	
25	权限中心	Permission		/permission	2026-03-05 09:47:22.446	1	\N	\N	2026-03-05 09:49:39.819	1	1	0	material:HealthAndSafetyOutlined	1	1	menu	menu	\N		
44	新增	DICT_ADD			2026-03-12 12:55:38.615	1	\N	\N	2026-03-12 12:55:38.615	1	0	0		0	1	button	\N	11		
26	系统配置	Config		/system/config	2026-03-06 02:41:33.05	1	\N	\N	2026-03-06 02:41:33.05	1	1	0	material:SettingsOutlined	0	1	menu	page	7	system/config/index	
3	监控页	Monitor		/dashboard/monitor	2026-02-24 10:37:45	1	\N	\N	2026-02-24 10:37:58	1	1	0		2	1	menu	page	1	dashboard/monitor/index	
27	新增	USER_ADD			2026-03-12 05:35:55.452	1	\N	\N	2026-03-12 05:35:55.452	1	0	0		0	1	button	\N	9		
4	Landing-测试window类型	Landing		/landing	2026-02-25 17:12:22	1	\N	\N	2026-03-12 08:18:57.696	1	0	0	material:CropLandscapeFilled	1	1	menu	window	5	pages/landing/index	
12	功能测试	FuncTest		/funcTest	2026-03-02 05:28:14.442	1	\N	\N	2026-03-12 08:34:20.656	1	1	0	material:TipsAndUpdatesTwotone	3	1	menu	menu	\N		
45	修改	DICT_EDIT			2026-03-12 12:55:53.899	1	\N	\N	2026-03-12 12:55:53.899	1	0	0		0	1	button	\N	11		
15	文件管理	File		/system/file	2026-03-03 06:51:53.141	1	\N	\N	2026-03-03 07:04:16.968	1	1	0	antd:FileOutlined	5	1	menu	page	7	system/file/index	
28	新增	MENU_ADD			2026-03-05 02:11:38.467	\N	\N	\N	2026-03-12 20:41:12	\N	0	0		0	1	button	\N	8		
9	用户管理	User		/system/user	2026-02-26 09:31:42.726	1	\N	\N	2026-03-05 09:47:32.423	1	1	0	antd:UserOutlined	0	1	menu	page	25	system/user/index	
14	定时任务	Timer		/system/timer	2026-03-02 08:19:32.093	1	\N	\N	2026-03-03 05:34:58.685	1	1	0	material:MoreTimeRound	4	1	menu	page	7	system/timer/index	
46	删除	DICT_DELETE			2026-03-12 12:56:07.6	1	\N	\N	2026-03-12 12:56:07.6	1	0	0		0	1	button	\N	11		
5	测试分组	T e s t G rou p		/testGroup	2026-02-25 17:24:22	1	\N	\N	2026-03-02 05:28:25.859	1	0	0	material:CropLandscapeFilled	2	1	menu	group	12		
16	操作日志	Log		/system/log	2026-03-03 09:25:39.984	1	\N	\N	2026-03-03 09:25:50.608	1	1	0	material:LogoDevFilled	6	1	menu	page	7	system/log/index	
13	分割线2	Division2			2026-03-02 05:37:00.581	1	1	2026-03-03 09:42:53.882	2026-03-03 09:42:53.892	1	1	0		3	1	menu	divider	\N		
6	分割线1	Division1			2026-02-25 17:43:01	1	1	2026-03-03 09:45:44.172	2026-03-03 09:45:44.186	1	0	0		1	1	menu	divider	\N		
18	部门列表	dept:list	GET	/api/depts	2026-03-04 02:13:44.476	\N	\N	\N	2026-03-04 02:13:44.476	\N	0	0		1	1	api	\N	\N	dept	
19	部门树	dept:tree	GET	/api/depts/tree	2026-03-04 02:13:44.5	\N	\N	\N	2026-03-04 02:13:44.5	\N	0	0		2	1	api	\N	\N	dept	
20	部门详情	dept:detail	GET	/api/depts/:id	2026-03-04 02:13:44.506	\N	\N	\N	2026-03-04 02:13:44.506	\N	0	0		3	1	api	\N	\N	dept	
21	创建部门	dept:create	POST	/api/depts	2026-03-04 02:13:44.51	\N	\N	\N	2026-03-04 02:13:44.51	\N	0	0		4	1	api	\N	\N	dept	
22	更新部门	dept:update	PUT	/api/depts/:id	2026-03-04 02:13:44.517	\N	\N	\N	2026-03-04 02:13:44.517	\N	0	0		5	1	api	\N	\N	dept	
23	删除部门	dept:delete	DELETE	/api/depts/:id	2026-03-04 02:13:44.522	\N	\N	\N	2026-03-04 02:13:44.522	\N	0	0		6	1	api	\N	\N	dept	
17	部门管理	Dept		/system/dept	2026-03-04 02:04:06.913	1	\N	\N	2026-03-05 09:48:55.413	1	1	0	ionicons5:BusinessOutline	4	1	menu	page	25	system/dept/index	
10	角色管理	Role		/system/role	2026-02-27 01:58:53.449	1	\N	\N	2026-03-05 09:47:42.525	1	1	0	material:AdminPanelSettingsFilled	1	1	menu	page	25	system/role/index	
8	菜单管理	Menu		/system/menu	2026-02-26 10:19:35	1	\N	\N	2026-03-05 09:47:52.142	1	0	0	material:MenuFilled	2	1	menu	page	25	system/menu/index	
11	字典管理	Dictionary		/system/dictionary	2026-02-27 07:47:38.625	1	\N	\N	2026-03-03 05:34:54.057	1	1	0	antd:DatabaseOutlined	3	1	menu	page	7	system/dictionary/index	
24	岗位管理	Post		/system/post	2026-03-05 02:11:38.467	1	\N	\N	2026-03-05 09:49:05.257	1	1	0	material:SignpostTwotone	0	1	menu	page	25	system/post/index	
29	按钮管理	MENU_BUTTON			2026-03-05 02:11:38.467	\N	\N	\N	2026-03-12 20:44:45	\N	0	0		0	1	button	\N	8		
30	分配权限	ROLE_PERMISSION			2026-03-12 20:46:40	\N	\N	\N	2026-03-12 20:46:43	\N	0	0		0	1	button	\N	10		
31	修改	MENU_EDIT			2026-03-12 12:48:18.073	1	\N	\N	2026-03-12 12:48:18.073	1	0	0		0	1	button	\N	8		
32	删除	MENU_DELETE			2026-03-12 12:48:32.007	1	\N	\N	2026-03-12 12:48:32.007	1	0	0		0	1	button	\N	8		
33	新增	ROLE_ADD			2026-03-12 12:49:50.285	1	\N	\N	2026-03-12 12:49:50.285	1	0	0		0	1	button	\N	10		
34	修改	ROLE_EDIT			2026-03-12 12:49:59.972	1	\N	\N	2026-03-12 12:49:59.972	1	0	0		0	1	button	\N	10		
35	删除	ROLE_DELETE			2026-03-12 12:50:10.955	1	\N	\N	2026-03-12 12:50:10.955	1	0	0		0	1	button	\N	10		
36	修改	USER_EDIT			2026-03-12 12:51:03.311	1	\N	\N	2026-03-12 12:51:03.311	1	0	0		0	1	button	\N	9		
37	删除	USER_DELETE			2026-03-12 12:51:14.3	1	\N	\N	2026-03-12 12:51:14.3	1	0	0		0	1	button	\N	9		
38	新增	POST_ADD			2026-03-12 12:52:12.485	1	\N	\N	2026-03-12 12:52:12.485	1	0	0		0	1	button	\N	24		
39	修改	POST_EDIT			2026-03-12 12:52:36.573	1	\N	\N	2026-03-12 12:52:36.573	1	0	0		0	1	button	\N	24		
40	删除	POST_DELETE			2026-03-12 12:52:45.266	1	\N	\N	2026-03-12 12:52:45.266	1	0	0		0	1	button	\N	24		
41	新增	DEPT_ADD			2026-03-12 12:53:46.957	1	\N	\N	2026-03-12 12:53:46.957	1	0	0		0	1	button	\N	17		
42	修改	DEPT_EDIT			2026-03-12 12:53:56.497	1	\N	\N	2026-03-12 12:53:56.497	1	0	0		0	1	button	\N	17		
47	字典子项	DICT_ITEM			2026-03-12 12:56:59.692	1	\N	\N	2026-03-12 12:56:59.692	1	0	0		0	1	button	\N	11		
49	新增	CONFIG_ADD			2026-03-12 13:02:25.238	1	\N	\N	2026-03-12 13:02:25.238	1	0	0		0	1	button	\N	26		
50	修改	CONFIG_EDIT			2026-03-12 13:02:35.988	1	\N	\N	2026-03-12 13:02:35.988	1	0	0		0	1	button	\N	26		
51	删除	CONFIG_DELETE			2026-03-12 13:02:43.926	1	\N	\N	2026-03-12 13:02:43.926	1	0	0		0	1	button	\N	26		
52	查看定时器任务	Timer:read	GET	/api/timers/page	2026-03-12 20:59:18	\N	\N	\N	2026-03-12 20:59:18	\N	0	0		0	1	api	\N	0		
53	新增	TIMER_ADD			2026-03-12 13:16:11.419	1	\N	\N	2026-03-12 13:16:11.419	1	0	0		0	1	button	\N	14		
54	修改	TIMER_EDIT			2026-03-12 13:16:20.883	1	\N	\N	2026-03-12 13:16:20.883	1	0	0		0	1	button	\N	14		
55	删除	TIMER_DELETE			2026-03-12 13:16:33.779	1	\N	\N	2026-03-12 13:16:33.779	1	0	0		0	1	button	\N	14		
56	执行	TIMER_RUN			2026-03-12 13:17:32.147	1	\N	\N	2026-03-12 13:17:32.147	1	0	0		0	1	button	\N	14		
57	日志	TIMER_LOG			2026-03-12 13:17:40.096	1	\N	\N	2026-03-12 13:17:40.096	1	0	0		0	1	button	\N	14		
1	Dashboard	Dashboard		/dashboard	2026-02-23 15:33:08	1	\N	\N	2026-02-26 09:41:53.07	1	0	0	ionicons5:HomeOutline	0	1	menu	menu	\N		
58	分页查询操作日志	OperationLog:read	GET	/api/operation-logs/page	2026-03-12 21:28:36	\N	\N	\N	2026-03-12 21:28:36	\N	0	0		0	1	api	\N	0		
59	分页查询登录日志	LoginLog:read	GET	/api/login-logs/page	2026-03-12 21:29:50	\N	\N	\N	2026-03-12 21:29:50	\N	0	0		0	1	api	\N	0		
48	系统配置分页列表	Config:list	GET	/api/config/page	2026-03-12 20:59:18	1	\N	\N	2026-03-12 20:59:22	1	0	0		0	1	api	\N	0		
61	分页查询文件列表	File:read	GET	/api/files/page	2026-03-12 21:48:01	\N	\N	\N	2026-03-12 21:48:09	\N	0	0		0	1	api	\N	0		
\.


--
-- Data for Name: sys_post; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_post (id, "postName", "postCode", sort, status, remark, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	董事长	Chairman	0	1		2026-03-05 02:12:52.207	2026-03-10 02:33:04.535	\N	\N	\N	\N
2	总经理	CEO	1	1		2026-03-10 02:33:18.613	2026-03-10 02:33:18.613	\N	\N	\N	\N
\.


--
-- Data for Name: sys_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_role (id, "roleName", "roleCode", "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", description, status, custom_depts, data_scope) FROM stdin;
1	超级管理员	super_admin	2026-02-09 09:42:45.688	1	\N	\N	2026-02-09 09:42:45.688	1	超级管理员	1	{}	DEPT
2	测试角色1	test1	2026-03-12 02:58:02.092	1	\N	\N	2026-03-12 02:58:02.092	1		1	{}	DEPT
\.


--
-- Data for Name: sys_role_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_role_permission ("roleId", "permissionId") FROM stdin;
1	48
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	25
1	26
1	27
1	28
1	29
1	30
1	31
1	32
1	33
1	34
1	35
1	36
1	37
1	38
1	39
1	40
1	41
1	42
1	43
1	44
1	45
1	46
1	47
1	51
1	50
1	49
1	52
1	53
1	54
1	55
1	57
1	56
1	58
1	59
1	61
\.


--
-- Data for Name: sys_timer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_timer (id, name, description, cron, "taskType", target, params, status, "lastRunAt", "nextRunAt", "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	测试定时任务		0,15,5 0 0 * * *	SCRIPT	xxx	\N	1	2026-03-09 16:00:15.004	\N	2026-03-02 09:26:09.819	2026-03-09 16:00:15.015	\N	1	1	\N
\.


--
-- Data for Name: sys_timer_execution_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_timer_execution_log (id, "timerId", status, "startAt", "endAt", duration, result) FROM stdin;
\.


--
-- Data for Name: sys_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_user (id, username, password, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", avatar, email, gender, mobile, nickname, status, dept_id, is_admin, post_id) FROM stdin;
1	admin	$2b$10$A1IxNzXhrn8bZ67zlskCQut1aBRQkpU3kWSf8khwgxa/ELZgYGSJq	2026-02-09 06:16:04.232	\N	\N	\N	2026-03-04 06:32:47.725	1	http://localhost:8080/uploads/1772264302055-tlosxd.jpg	176620731742163.com	0	17662073174	admin	1	1	t	\N
\.


--
-- Data for Name: sys_user_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sys_user_role ("userId", "roleId") FROM stdin;
1	1
\.


--
-- Name: sys_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_config_id_seq', 1, true);


--
-- Name: sys_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_dept_id_seq', 2, true);


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_dict_item_id_seq', 17, true);


--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_dict_type_id_seq', 6, true);


--
-- Name: sys_file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_file_id_seq', 34, true);


--
-- Name: sys_login_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_login_log_id_seq', 100, true);


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_operation_log_id_seq', 33, true);


--
-- Name: sys_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_permission_id_seq', 61, true);


--
-- Name: sys_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_post_id_seq', 2, true);


--
-- Name: sys_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_role_id_seq', 2, true);


--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_timer_execution_log_id_seq', 4, true);


--
-- Name: sys_timer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_timer_id_seq', 1, true);


--
-- Name: sys_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sys_user_id_seq', 2, false);


--
-- Name: sys_config sys_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_config
    ADD CONSTRAINT sys_config_pkey PRIMARY KEY (id);


--
-- Name: sys_dept sys_dept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_pkey PRIMARY KEY (id);


--
-- Name: sys_dict_item sys_dict_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT sys_dict_item_pkey PRIMARY KEY (id);


--
-- Name: sys_dict_type sys_dict_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dict_type
    ADD CONSTRAINT sys_dict_type_pkey PRIMARY KEY (id);


--
-- Name: sys_file sys_file_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_file
    ADD CONSTRAINT sys_file_pkey PRIMARY KEY (id);


--
-- Name: sys_login_log sys_login_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_login_log
    ADD CONSTRAINT sys_login_log_pkey PRIMARY KEY (id);


--
-- Name: sys_operation_log sys_operation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_operation_log
    ADD CONSTRAINT sys_operation_log_pkey PRIMARY KEY (id);


--
-- Name: sys_permission sys_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_permission
    ADD CONSTRAINT sys_permission_pkey PRIMARY KEY (id);


--
-- Name: sys_post sys_post_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_post
    ADD CONSTRAINT sys_post_pkey PRIMARY KEY (id);


--
-- Name: sys_role_permission sys_role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT sys_role_permission_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- Name: sys_role sys_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_role
    ADD CONSTRAINT sys_role_pkey PRIMARY KEY (id);


--
-- Name: sys_timer_execution_log sys_timer_execution_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_timer_execution_log
    ADD CONSTRAINT sys_timer_execution_log_pkey PRIMARY KEY (id);


--
-- Name: sys_timer sys_timer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_timer
    ADD CONSTRAINT sys_timer_pkey PRIMARY KEY (id);


--
-- Name: sys_user sys_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_pkey PRIMARY KEY (id);


--
-- Name: sys_user_role sys_user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT sys_user_role_pkey PRIMARY KEY ("userId", "roleId");


--
-- Name: sys_config_configKey_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_config_configKey_idx" ON public.sys_config USING btree ("configKey");


--
-- Name: sys_config_configKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sys_config_configKey_key" ON public.sys_config USING btree ("configKey");


--
-- Name: sys_config_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_config_status_idx ON public.sys_config USING btree (status);


--
-- Name: sys_dept_ancestors_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dept_ancestors_idx ON public.sys_dept USING btree (ancestors);


--
-- Name: sys_dept_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dept_parent_id_idx ON public.sys_dept USING btree (parent_id);


--
-- Name: sys_dept_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dept_status_idx ON public.sys_dept USING btree (status);


--
-- Name: sys_dict_item_dictTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_dict_item_dictTypeId_idx" ON public.sys_dict_item USING btree ("dictTypeId");


--
-- Name: sys_dict_item_sort_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dict_item_sort_idx ON public.sys_dict_item USING btree (sort);


--
-- Name: sys_dict_item_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dict_item_status_idx ON public.sys_dict_item USING btree (status);


--
-- Name: sys_dict_type_dictCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_dict_type_dictCode_idx" ON public.sys_dict_type USING btree ("dictCode");


--
-- Name: sys_dict_type_dictCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sys_dict_type_dictCode_key" ON public.sys_dict_type USING btree ("dictCode");


--
-- Name: sys_dict_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_dict_type_status_idx ON public.sys_dict_type USING btree (status);


--
-- Name: sys_file_businessId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_file_businessId_idx" ON public.sys_file USING btree ("businessId");


--
-- Name: sys_file_businessType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_file_businessType_idx" ON public.sys_file USING btree ("businessType");


--
-- Name: sys_file_fileType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_file_fileType_idx" ON public.sys_file USING btree ("fileType");


--
-- Name: sys_file_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_file_filename_idx ON public.sys_file USING btree (filename);


--
-- Name: sys_file_filename_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sys_file_filename_key ON public.sys_file USING btree (filename);


--
-- Name: sys_file_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_file_status_idx ON public.sys_file USING btree (status);


--
-- Name: sys_login_log_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_login_log_createdAt_idx" ON public.sys_login_log USING btree ("createdAt");


--
-- Name: sys_login_log_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_login_log_userId_idx" ON public.sys_login_log USING btree ("userId");


--
-- Name: sys_login_log_username_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_login_log_username_idx ON public.sys_login_log USING btree (username);


--
-- Name: sys_operation_log_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_operation_log_createdAt_idx" ON public.sys_operation_log USING btree ("createdAt");


--
-- Name: sys_operation_log_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_operation_log_module_idx ON public.sys_operation_log USING btree (module);


--
-- Name: sys_operation_log_operation_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_operation_log_operation_idx ON public.sys_operation_log USING btree (operation);


--
-- Name: sys_operation_log_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_operation_log_userId_idx" ON public.sys_operation_log USING btree ("userId");


--
-- Name: sys_permission_method_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_permission_method_path_idx ON public.sys_permission USING btree (method, path);


--
-- Name: sys_permission_permCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_permission_permCode_idx" ON public.sys_permission USING btree ("permCode");


--
-- Name: sys_permission_permCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sys_permission_permCode_key" ON public.sys_permission USING btree ("permCode");


--
-- Name: sys_permission_resourceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_permission_resourceType_idx" ON public.sys_permission USING btree ("resourceType");


--
-- Name: sys_post_postCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_post_postCode_idx" ON public.sys_post USING btree ("postCode");


--
-- Name: sys_post_postCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sys_post_postCode_key" ON public.sys_post USING btree ("postCode");


--
-- Name: sys_post_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_post_status_idx ON public.sys_post USING btree (status);


--
-- Name: sys_role_permission_permissionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_role_permission_permissionId_idx" ON public.sys_role_permission USING btree ("permissionId");


--
-- Name: sys_role_permission_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_role_permission_roleId_idx" ON public.sys_role_permission USING btree ("roleId");


--
-- Name: sys_role_roleCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_role_roleCode_idx" ON public.sys_role USING btree ("roleCode");


--
-- Name: sys_role_roleCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sys_role_roleCode_key" ON public.sys_role USING btree ("roleCode");


--
-- Name: sys_timer_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_timer_createdAt_idx" ON public.sys_timer USING btree ("createdAt");


--
-- Name: sys_timer_execution_log_startAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_timer_execution_log_startAt_idx" ON public.sys_timer_execution_log USING btree ("startAt");


--
-- Name: sys_timer_execution_log_timerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_timer_execution_log_timerId_idx" ON public.sys_timer_execution_log USING btree ("timerId");


--
-- Name: sys_timer_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_timer_status_idx ON public.sys_timer USING btree (status);


--
-- Name: sys_user_dept_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_user_dept_id_idx ON public.sys_user USING btree (dept_id);


--
-- Name: sys_user_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_user_email_idx ON public.sys_user USING btree (email);


--
-- Name: sys_user_mobile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_user_mobile_idx ON public.sys_user USING btree (mobile);


--
-- Name: sys_user_post_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_user_post_id_idx ON public.sys_user USING btree (post_id);


--
-- Name: sys_user_role_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_user_role_roleId_idx" ON public.sys_user_role USING btree ("roleId");


--
-- Name: sys_user_role_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sys_user_role_userId_idx" ON public.sys_user_role USING btree ("userId");


--
-- Name: sys_user_username_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sys_user_username_idx ON public.sys_user USING btree (username);


--
-- Name: sys_user_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sys_user_username_key ON public.sys_user USING btree (username);


--
-- Name: sys_dept sys_dept_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_dept sys_dept_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sys_dept(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_dict_item sys_dict_item_dictTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT "sys_dict_item_dictTypeId_fkey" FOREIGN KEY ("dictTypeId") REFERENCES public.sys_dict_type(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_login_log sys_login_log_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_login_log
    ADD CONSTRAINT "sys_login_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_role_permission sys_role_permission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "sys_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.sys_permission(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_role_permission sys_role_permission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "sys_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_timer_execution_log sys_timer_execution_log_timerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_timer_execution_log
    ADD CONSTRAINT "sys_timer_execution_log_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES public.sys_timer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_user sys_user_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.sys_dept(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_user sys_user_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.sys_post(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_user_role sys_user_role_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT "sys_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_user_role sys_user_role_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT "sys_user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

