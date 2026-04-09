--
-- PostgreSQL database dump
--

\restrict PqgCxBmzSFxRxdoixk0Wcwj6iY2D7Hglf2vC5e7SQRG1flQnvxRk97j49Hh91RO

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: DataScope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DataScope" AS ENUM (
    'ALL',
    'CUSTOM',
    'DEPT',
    'DEPT_AND_CHILD'
);


--
-- Name: FileType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FileType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'ARCHIVE',
    'FILE'
);


--
-- Name: LogOperation; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LogOperation" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);


--
-- Name: MenuType; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResourceType" AS ENUM (
    'menu',
    'api',
    'button'
);


--
-- Name: TaskType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskType" AS ENUM (
    'HTTP',
    'SCRIPT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    name text NOT NULL,
    checksum text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_config; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_config_id_seq OWNED BY public.sys_config.id;


--
-- Name: sys_dept; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_dept_id_seq OWNED BY public.sys_dept.id;


--
-- Name: sys_dict_item; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_dict_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_dict_item_id_seq OWNED BY public.sys_dict_item.id;


--
-- Name: sys_dict_type; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_dict_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_dict_type_id_seq OWNED BY public.sys_dict_type.id;


--
-- Name: sys_file; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_file_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_file_id_seq OWNED BY public.sys_file.id;


--
-- Name: sys_login_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_login_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_login_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_login_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_login_log_id_seq OWNED BY public.sys_login_log.id;


--
-- Name: sys_operation_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_operation_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_operation_log_id_seq OWNED BY public.sys_operation_log.id;


--
-- Name: sys_permission; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_permission_id_seq OWNED BY public.sys_permission.id;


--
-- Name: sys_post; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_post_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_post_id_seq OWNED BY public.sys_post.id;


--
-- Name: sys_role; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_role_id_seq OWNED BY public.sys_role.id;


--
-- Name: sys_role_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_role_permission (
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


--
-- Name: sys_timer; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_timer_execution_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_timer_execution_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_timer_execution_log_id_seq OWNED BY public.sys_timer_execution_log.id;


--
-- Name: sys_timer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_timer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_timer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_timer_id_seq OWNED BY public.sys_timer.id;


--
-- Name: sys_user; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sys_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_user_id_seq OWNED BY public.sys_user.id;


--
-- Name: sys_user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_user_role (
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL
);


--
-- Name: sys_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_config ALTER COLUMN id SET DEFAULT nextval('public.sys_config_id_seq'::regclass);


--
-- Name: sys_dept id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dept ALTER COLUMN id SET DEFAULT nextval('public.sys_dept_id_seq'::regclass);


--
-- Name: sys_dict_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_item_id_seq'::regclass);


--
-- Name: sys_dict_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_type ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_type_id_seq'::regclass);


--
-- Name: sys_file id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_file ALTER COLUMN id SET DEFAULT nextval('public.sys_file_id_seq'::regclass);


--
-- Name: sys_login_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_login_log ALTER COLUMN id SET DEFAULT nextval('public.sys_login_log_id_seq'::regclass);


--
-- Name: sys_operation_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_operation_log ALTER COLUMN id SET DEFAULT nextval('public.sys_operation_log_id_seq'::regclass);


--
-- Name: sys_permission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_permission ALTER COLUMN id SET DEFAULT nextval('public.sys_permission_id_seq'::regclass);


--
-- Name: sys_post id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_post ALTER COLUMN id SET DEFAULT nextval('public.sys_post_id_seq'::regclass);


--
-- Name: sys_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role ALTER COLUMN id SET DEFAULT nextval('public.sys_role_id_seq'::regclass);


--
-- Name: sys_timer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_timer ALTER COLUMN id SET DEFAULT nextval('public.sys_timer_id_seq'::regclass);


--
-- Name: sys_timer_execution_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_timer_execution_log ALTER COLUMN id SET DEFAULT nextval('public.sys_timer_execution_log_id_seq'::regclass);


--
-- Name: sys_user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user ALTER COLUMN id SET DEFAULT nextval('public.sys_user_id_seq'::regclass);


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_migrations (name, checksum, applied_at) FROM stdin;
20260204015605_init	e620e078ef59843932169eeb3ab9184eeab8d536952aff87e225eae8922668a7	2026-03-30 15:56:31.841505+08
20260204031111	896afde653d0d859cb2ff57256aa6215520b1539b2c20b40841687ffda276b9c	2026-03-30 15:56:31.851291+08
20260204054647_path	49a7d2c8b12996d5e567bd864a829304821ca7cf4cd2ca98947360f2c2a636be	2026-03-30 15:56:31.863886+08
20260204064641_add_performance_indexes	af64a711def3ef905c89ace9c9e96721e9198b61058d5fa10551f32715fcb1e2	2026-03-30 15:56:31.866639+08
20260205022407	9fb5a3eeee61406b69826ac5cc35e0b33c27f824e8686a2a51cf0326fc6656f8	2026-03-30 15:56:31.87218+08
20260205031013_status	af2601a4e04c9b441cd4101f1d808f706e15d18d929b6248b22991b2ef99dd74	2026-03-30 15:56:31.876171+08
20260205032319_resource_type_enum	d5f95115ca2982616b3818cd0aab00422d6138b771beed13342eb3856e36ef7f	2026-03-30 15:56:31.881338+08
20260206013458	d1749a5a935198397effaf3225111be2a7ed822759f2213b8a95737a9ab125f8	2026-03-30 15:56:31.886409+08
20260206013651	6111ecd45103465ff3918d2a19889f411722b10c8653cd625215cf676c5d0078	2026-03-30 15:56:31.889048+08
20260206081934_parent_id	f10651704336720e1be83503215fc1aed9e38d9c311e503284568eb3925bff98	2026-03-30 15:56:31.890998+08
20260209065846_status_default_1	b00a7796b927258c06af24a241a7bd9f2ee821ee0574d813f131cb41f7c7c58a	2026-03-30 15:56:31.892125+08
20260215004706_add_file_model	978d4641d390940965b68eaae7bedd120634276de9f1af7cb65ab384f54fd70a	2026-03-30 15:56:31.893285+08
20260215005552_add_unique_to_filename	8848808a28078e09eb7661c1aa33b061cd0bf095b48f986b9cd00778eb6787d0	2026-03-30 15:56:31.899146+08
20260215012158_add_business_fields	5f9a9146f76c19a31549e18da95a7dde4a8dfbbfcf5126a424a3acb8c34c168d	2026-03-30 15:56:31.900745+08
20260216094156_add_login_log	0c413a65139e172fd66c12ecc3336f08eaa1987b5dfa9b963c5a6bce1479cd7b	2026-03-30 15:56:31.902387+08
20260216095716_add_timer_tables	b55f73b4f015fd721b7c3397f350ab96fa4ee15ea7b5ef9511b1fe94094ca3a5	2026-03-30 15:56:31.908018+08
20260218013823_add_dict_tables	b2a1571b613f33d9d1d5b9ee3150fe260fc4e52f0d6d18b53b43e1d6e4c70d41	2026-03-30 15:56:31.912872+08
20260223081558_permission	4993e0f68753db91c1bce3c247da3b4d2152af34565c20e8de36b39519e32dbb	2026-03-30 15:56:31.91701+08
20260224025016_menu_type_divider_group	a30c090860720522382dcd5834330be36ed1db34a605b615c808f937dfab38ae	2026-03-30 15:56:31.918127+08
20260225013242_perm_name	069baccfa037cb8de0fc837f22958ebe0b9dd91c5a21fa4246b065aa3681e767	2026-03-30 15:56:31.918655+08
20260226063557_permission_frame_url	6ec99e462b1dd07ff14948ee1ceb646bc5cb9da3f708910fdc35c7374212ccca	2026-03-30 15:56:31.919123+08
20260303083349_add_operation_log	f9ab91fcd0031e08e77a15659d7259d398c545130999f2ab589fb2459da796a1	2026-03-30 15:56:31.919537+08
20260304014324_add_dept_and_data_scope	1355074e0bdde25093c9551f1ed72d293d86309eaf4051edb8106463b0146adc	2026-03-30 15:56:31.92149+08
20260304015106_add_is_admin_to_user	bece4d16cd8c487a04fc1d1905e2fc8f304c981effa36f11efd6b9f08ac46626	2026-03-30 15:56:31.926938+08
20260304081423_add_post_table	22de2e841f88e69e2256e4630a81cebf00b35e8217eecf837297d48b7ee63dce	2026-03-30 15:56:31.927488+08
20260306022040_add_sys_config	6c233c99fe934a18d3d9e132620490bc86ac705a6a29a04199ff3fd241375e0c	2026-03-30 15:56:31.929758+08
20260313161154_rename_deleted_at	898801a337cfe5c42609b540d9ebeb4588f435322f3635ae2a4668888daaa2bf	2026-03-30 15:56:31.931745+08
\.


--
-- Data for Name: sys_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_config (id, "configKey", "configValue", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
\.


--
-- Data for Name: sys_dept; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_dept (id, name, parent_id, ancestors, leader_id, status, sort, remark, created_at, updated_at, "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
\.


--
-- Data for Name: sys_dict_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	1	正常	1		0	1	2026-03-31 09:50:25	2026-03-31 09:50:27	\N	\N	\N	\N
2	1	禁用	0		1	1	2026-03-31 09:51:01	2026-03-31 09:51:03	\N	\N	\N	\N
3	2	是	1		0	1	2026-03-31 02:18:59.567	2026-03-31 02:18:59.567	\N	1	1	\N
4	2	否	0		0	1	2026-03-31 02:19:19.966	2026-03-31 02:19:19.966	\N	1	1	\N
5	3	菜单	menu		0	1	2026-03-31 02:20:52.038	2026-03-31 02:20:52.038	\N	1	1	\N
6	3	页面	page		0	1	2026-03-31 02:21:06.071	2026-03-31 02:21:06.071	\N	1	1	\N
7	3	外链	link		0	1	2026-03-31 02:21:16.6	2026-03-31 02:21:16.6	\N	1	1	\N
8	3	内链	iframe		0	1	2026-03-31 02:21:26.062	2026-03-31 02:21:26.062	\N	1	1	\N
9	3	新窗口	window		0	1	2026-03-31 02:21:50.308	2026-03-31 02:21:50.308	\N	1	1	\N
10	3	分割线	divider		0	1	2026-03-31 02:22:08.871	2026-03-31 02:22:08.871	\N	1	1	\N
11	3	分组	group		0	1	2026-03-31 02:22:16.815	2026-03-31 02:22:16.815	\N	1	1	\N
12	4	菜单	menu		0	1	2026-03-31 02:23:22.713	2026-03-31 02:23:22.713	\N	1	1	\N
14	4	按钮	button		0	1	2026-03-31 02:23:45.574	2026-03-31 02:23:45.574	\N	1	1	\N
13	4	接口	api		0	1	2026-03-31 02:23:34.779	2026-03-31 02:23:57.377	\N	1	1	\N
\.


--
-- Data for Name: sys_dict_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
1	基础状态	BASE_STATUS		1	2026-03-31 01:48:30.478	2026-03-31 01:48:30.478	\N	1	1	\N
2	是否	YES_NO		1	2026-03-31 01:57:18.835	2026-03-31 01:57:18.835	\N	1	1	\N
3	菜单类型	MENU_TYPE		1	2026-03-31 02:19:57.645	2026-03-31 02:19:57.645	\N	1	1	\N
4	资源类型	RESOURCE_TYPE		1	2026-03-31 02:20:13.564	2026-03-31 02:20:13.564	\N	1	1	\N
\.


--
-- Data for Name: sys_file; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_file (id, filename, "originalName", size, mimetype, path, extension, "fileType", "isPublic", status, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy", "businessId", "businessType") FROM stdin;
\.


--
-- Data for Name: sys_login_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_login_log (id, "userId", username, ip, "userAgent", status, message, "createdAt") FROM stdin;
1	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:15:42.22475
2	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:15:48.239245
3	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:19:58.028188
4	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:20:04.744543
5	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:20:23.822452
6	\N	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	用户名或密码错误	2026-03-30 16:20:35.716195
7	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-30 16:23:12.904025
8	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-31 09:40:10.076607
9	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-31 10:13:47.664769
10	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-31 11:16:54.151879
11	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-31 16:22:23.330456
12	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-03-31 16:22:46.509652
13	1	admin	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	2026-04-08 17:05:03.145932
\.


--
-- Data for Name: sys_operation_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_operation_log (id, "userId", username, module, operation, description, method, path, params, ip, "userAgent", status, result, duration, "createdAt") FROM stdin;
4	\N	unknown	unknown	CREATE	\N	UNKNOWN	/	\N	\N	\N	1	\N	\N	2026-03-31 10:09:57.015
20	1	admin	permission	CREATE	\N	POST	/api/permissions	{"status": 1, "parentId": 6, "permCode": "USER_ADD", "permName": "用户新增", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	0	Failed query: insert into "sys_permission" ("id", "permName", "permCode", "method", "component", "resourceType", "menuType", "path", "icon", "sort", "cache", "hidden", "frameUrl", "status", "parentId", "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") values (default, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, default, $17, $18, default) returning "id", "permName", "permCode", "method", "component", "resourceType", "menuType", "path", "icon", "sort", "cache", "hidden", "frameUrl", "status", "parentId", "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy"\nparams: 用户新增,USER_ADD,,,button,,,,0,0,0,,1,6,2026-03-31T02:49:39.125Z,2026-03-31T02:49:39.125Z,1,1	11	2026-03-31 10:49:42.011031
21	1	admin	permission	CREATE	创建权限 用户新增	POST	/api/permissions	{"status": 1, "parentId": 6, "permCode": "USER_ADD", "permName": "用户新增", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	14	2026-03-31 11:03:06.031965
22	1	admin	permission	CREATE	创建权限 角色新增	POST	/api/permissions	{"status": 1, "parentId": 5, "permCode": "ROLE_ADD", "permName": "角色新增", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	5	2026-03-31 11:06:42.004795
23	1	admin	permission	CREATE	创建权限 分配资源权限	POST	/api/permissions	{"status": 1, "parentId": 5, "permCode": "ROLE_PERMISSION", "permName": "分配资源权限", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	10	2026-03-31 11:06:57.004392
24	1	admin	permission	CREATE	创建权限 角色修改	POST	/api/permissions	{"status": 1, "parentId": 5, "permCode": "ROLE_EDIT", "permName": "角色修改", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	13	2026-03-31 11:07:12.004894
25	1	admin	permission	CREATE	创建权限 角色删除	POST	/api/permissions	{"status": 1, "parentId": 5, "permCode": "ROLE_DELETE", "permName": "角色删除", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	12	2026-03-31 11:07:24.003332
26	1	admin	role	CREATE	创建角色	POST	/api/roles/1/permissions/batch	{"permissionIds": [4, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 5, 20, 19, 21, 22, 18]}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	8	2026-03-31 11:07:57.005757
27	1	admin	permission	CREATE	创建权限 用户修改	POST	/api/permissions	{"status": 1, "parentId": 6, "permCode": "USER_EDIT", "permName": "用户修改", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	9	2026-03-31 11:08:36.003979
28	1	admin	permission	CREATE	创建权限 用户删除	POST	/api/permissions	{"status": 1, "parentId": 6, "permCode": "USER_DELETE", "permName": "用户删除", "resourceType": "button"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	12	2026-03-31 11:08:51.004457
29	1	admin	role	CREATE	创建角色	POST	/api/roles/1/permissions/batch	{"permissionIds": [4, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 5, 20, 19, 21, 22, 18, 24, 23]}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	1	\N	6	2026-03-31 11:09:00.004304
\.


--
-- Data for Name: sys_permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_permission (id, "permName", "permCode", method, path, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", cache, hidden, icon, sort, status, "resourceType", "menuType", "parentId", component, "frameUrl") FROM stdin;
4	资源管理	Menu		/permission/menu	2026-03-31 09:37:51	\N	\N	\N	2026-03-31 09:37:53	\N	1	0		1	1	menu	page	3	system/menu/index	
1	Dashboard	Dashboard		/dashboard	2026-03-31 09:33:28	\N	\N	\N	2026-03-31 09:33:31	\N	0	0		1	1	menu	menu	0		
2	工作台	Workbench		/dashboard/workbench	2026-03-31 09:35:40	\N	\N	\N	2026-03-31 09:35:42	\N	1	0		1	1	menu	page	1		
3	权限配置	Permission		/permission	2026-03-31 09:36:50	\N	\N	\N	2026-03-31 09:36:52	\N	0	0		2	1	menu	menu	0		
6	用户管理	User		/permission/user	2026-03-31 09:42:59	\N	\N	\N	2026-03-31 09:43:01	\N	1	0		3	1	menu	page	3	system/user/index	
7	系统配置	System		/system	2026-03-31 09:44:38	\N	\N	\N	2026-03-31 09:44:41	\N	0	0		3	1	menu	menu	0		
8	字典管理	Dict		/dict	2026-03-31 09:45:25	\N	\N	\N	2026-03-31 09:45:27	\N	0	0		1	1	menu	page	7	system/dictionary/index	
9	新增字典	DICT_ADD			2026-03-31 09:47:51	\N	\N	\N	2026-03-31 09:47:48	\N	0	0		0	1	button	\N	8		
10	字典项	DICT_ITEM			2026-03-31 09:49:11	\N	\N	\N	2026-03-31 09:49:14	\N	0	0		0	1	button	\N	8		
11	修改字典	DICT_EDIT			2026-03-31 09:51:53	\N	\N	\N	2026-03-31 09:51:55	\N	0	0		0	1	button	\N	8		
12	删除字典	DICT_DELETE			2026-03-31 09:52:38	\N	\N	\N	2026-03-31 09:52:41	\N	0	0		0	1	button	\N	8		
13	新增资源	MENU_ADD			2026-03-31 09:53:43	\N	\N	\N	2026-03-31 09:53:46	\N	0	0		0	1	button	\N	4		
14	按钮管理	MENU_BUTTON			2026-03-31 09:55:00	\N	\N	\N	2026-03-31 09:55:00	\N	0	0		0	1	button	\N	4		
15	修改资源	MENU_EDIT			2026-03-31 09:55:51	\N	\N	\N	2026-03-31 09:55:51	\N	0	0		0	1	button	\N	4		
16	删除资源	MENU_DELETE			2026-03-31 09:55:51	\N	\N	\N	2026-03-31 09:56:18	\N	0	0		0	1	button	\N	4		
17	获取部门树	dept:list	GET	/api/depts/tree	2026-03-31 10:45:42	\N	\N	\N	2026-03-31 10:45:42	\N	0	0		0	1	api	\N	0		
18	用户新增	USER_ADD			2026-03-31 03:03:05.934	1	\N	\N	2026-03-31 03:03:05.933	1	0	0		0	1	button	\N	6		
5	角色管理	Role		/permission/role	2026-03-31 09:42:31	\N	\N	\N	2026-03-31 09:42:33	\N	0	0		2	1	menu	page	3	system/role/index	
19	角色新增	ROLE_ADD			2026-03-31 03:06:39.314	1	\N	\N	2026-03-31 03:06:39.314	1	0	0		0	1	button	\N	5		
20	分配资源权限	ROLE_PERMISSION			2026-03-31 03:06:55.539	1	\N	\N	2026-03-31 03:06:55.539	1	0	0		0	1	button	\N	5		
21	角色修改	ROLE_EDIT			2026-03-31 03:07:10.47	1	\N	\N	2026-03-31 03:07:10.47	1	0	0		0	1	button	\N	5		
22	角色删除	ROLE_DELETE			2026-03-31 03:07:23.479	1	\N	\N	2026-03-31 03:07:23.478	1	0	0		0	1	button	\N	5		
23	用户修改	USER_EDIT			2026-03-31 03:08:34.291	1	\N	\N	2026-03-31 03:08:34.291	1	0	0		0	1	button	\N	6		
24	用户删除	USER_DELETE			2026-03-31 03:08:49.195	1	\N	\N	2026-03-31 03:08:49.195	1	0	0		0	1	button	\N	6		
\.


--
-- Data for Name: sys_post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_post (id, "postName", "postCode", sort, status, remark, "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
\.


--
-- Data for Name: sys_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_role (id, "roleName", "roleCode", "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", description, status, custom_depts, data_scope) FROM stdin;
1	超级管理员	admin	2026-03-30 16:33:59	\N	\N	\N	2026-03-30 16:34:03	\N		1	{}	ALL
\.


--
-- Data for Name: sys_role_permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_role_permission ("roleId", "permissionId") FROM stdin;
1	4
1	1
1	2
1	3
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
1	5
1	20
1	19
1	21
1	22
1	18
1	24
1	23
\.


--
-- Data for Name: sys_timer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_timer (id, name, description, cron, "taskType", target, params, status, "lastRunAt", "nextRunAt", "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "deletedBy") FROM stdin;
\.


--
-- Data for Name: sys_timer_execution_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_timer_execution_log (id, "timerId", status, "startAt", "endAt", duration, result) FROM stdin;
\.


--
-- Data for Name: sys_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_user (id, username, password, "createdAt", "createdBy", "deletedBy", "deletedAt", "updatedAt", "updatedBy", avatar, email, gender, mobile, nickname, status, dept_id, is_admin, post_id) FROM stdin;
1	admin	$2b$10$t2GlTe47xKlGyUD33IsCh.2S7irm4upBBnb.kkPXcZTf.KS7P2F.a	2026-03-30 08:21:57.278	\N	\N	\N	2026-03-30 08:21:57.277	\N		17662073174@163.com	0	17662073174	admin	1	\N	t	\N
\.


--
-- Data for Name: sys_user_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_user_role ("userId", "roleId") FROM stdin;
1	1
\.


--
-- Name: sys_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_config_id_seq', 1, false);


--
-- Name: sys_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_dept_id_seq', 1, false);


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_dict_item_id_seq', 15, false);


--
-- Name: sys_dict_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_dict_type_id_seq', 5, false);


--
-- Name: sys_file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_file_id_seq', 1, false);


--
-- Name: sys_login_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_login_log_id_seq', 13, true);


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_operation_log_id_seq', 29, true);


--
-- Name: sys_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_permission_id_seq', 24, true);


--
-- Name: sys_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_post_id_seq', 1, false);


--
-- Name: sys_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_role_id_seq', 2, false);


--
-- Name: sys_timer_execution_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_timer_execution_log_id_seq', 1, false);


--
-- Name: sys_timer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_timer_id_seq', 1, false);


--
-- Name: sys_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_user_id_seq', 3, true);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (name);


--
-- Name: sys_config sys_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_config
    ADD CONSTRAINT sys_config_pkey PRIMARY KEY (id);


--
-- Name: sys_dept sys_dept_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_pkey PRIMARY KEY (id);


--
-- Name: sys_dict_item sys_dict_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT sys_dict_item_pkey PRIMARY KEY (id);


--
-- Name: sys_dict_type sys_dict_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_type
    ADD CONSTRAINT sys_dict_type_pkey PRIMARY KEY (id);


--
-- Name: sys_file sys_file_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_file
    ADD CONSTRAINT sys_file_pkey PRIMARY KEY (id);


--
-- Name: sys_login_log sys_login_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_login_log
    ADD CONSTRAINT sys_login_log_pkey PRIMARY KEY (id);


--
-- Name: sys_operation_log sys_operation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_operation_log
    ADD CONSTRAINT sys_operation_log_pkey PRIMARY KEY (id);


--
-- Name: sys_permission sys_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_permission
    ADD CONSTRAINT sys_permission_pkey PRIMARY KEY (id);


--
-- Name: sys_post sys_post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_post
    ADD CONSTRAINT sys_post_pkey PRIMARY KEY (id);


--
-- Name: sys_role_permission sys_role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT sys_role_permission_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- Name: sys_role sys_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role
    ADD CONSTRAINT sys_role_pkey PRIMARY KEY (id);


--
-- Name: sys_timer_execution_log sys_timer_execution_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_timer_execution_log
    ADD CONSTRAINT sys_timer_execution_log_pkey PRIMARY KEY (id);


--
-- Name: sys_timer sys_timer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_timer
    ADD CONSTRAINT sys_timer_pkey PRIMARY KEY (id);


--
-- Name: sys_user sys_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_pkey PRIMARY KEY (id);


--
-- Name: sys_user_role sys_user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT sys_user_role_pkey PRIMARY KEY ("userId", "roleId");


--
-- Name: sys_config_configKey_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_config_configKey_idx" ON public.sys_config USING btree ("configKey");


--
-- Name: sys_config_configKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sys_config_configKey_key" ON public.sys_config USING btree ("configKey");


--
-- Name: sys_config_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_config_status_idx ON public.sys_config USING btree (status);


--
-- Name: sys_dept_ancestors_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dept_ancestors_idx ON public.sys_dept USING btree (ancestors);


--
-- Name: sys_dept_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dept_parent_id_idx ON public.sys_dept USING btree (parent_id);


--
-- Name: sys_dept_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dept_status_idx ON public.sys_dept USING btree (status);


--
-- Name: sys_dict_item_dictTypeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_dict_item_dictTypeId_idx" ON public.sys_dict_item USING btree ("dictTypeId");


--
-- Name: sys_dict_item_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dict_item_sort_idx ON public.sys_dict_item USING btree (sort);


--
-- Name: sys_dict_item_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dict_item_status_idx ON public.sys_dict_item USING btree (status);


--
-- Name: sys_dict_type_dictCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_dict_type_dictCode_idx" ON public.sys_dict_type USING btree ("dictCode");


--
-- Name: sys_dict_type_dictCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sys_dict_type_dictCode_key" ON public.sys_dict_type USING btree ("dictCode");


--
-- Name: sys_dict_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_dict_type_status_idx ON public.sys_dict_type USING btree (status);


--
-- Name: sys_file_businessId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_file_businessId_idx" ON public.sys_file USING btree ("businessId");


--
-- Name: sys_file_businessType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_file_businessType_idx" ON public.sys_file USING btree ("businessType");


--
-- Name: sys_file_fileType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_file_fileType_idx" ON public.sys_file USING btree ("fileType");


--
-- Name: sys_file_filename_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_file_filename_idx ON public.sys_file USING btree (filename);


--
-- Name: sys_file_filename_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sys_file_filename_key ON public.sys_file USING btree (filename);


--
-- Name: sys_file_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_file_status_idx ON public.sys_file USING btree (status);


--
-- Name: sys_login_log_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_login_log_createdAt_idx" ON public.sys_login_log USING btree ("createdAt");


--
-- Name: sys_login_log_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_login_log_userId_idx" ON public.sys_login_log USING btree ("userId");


--
-- Name: sys_login_log_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_login_log_username_idx ON public.sys_login_log USING btree (username);


--
-- Name: sys_operation_log_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_operation_log_createdAt_idx" ON public.sys_operation_log USING btree ("createdAt");


--
-- Name: sys_operation_log_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_operation_log_module_idx ON public.sys_operation_log USING btree (module);


--
-- Name: sys_operation_log_operation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_operation_log_operation_idx ON public.sys_operation_log USING btree (operation);


--
-- Name: sys_operation_log_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_operation_log_userId_idx" ON public.sys_operation_log USING btree ("userId");


--
-- Name: sys_permission_method_path_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_permission_method_path_idx ON public.sys_permission USING btree (method, path);


--
-- Name: sys_permission_permCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_permission_permCode_idx" ON public.sys_permission USING btree ("permCode");


--
-- Name: sys_permission_permCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sys_permission_permCode_key" ON public.sys_permission USING btree ("permCode");


--
-- Name: sys_permission_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_permission_resourceType_idx" ON public.sys_permission USING btree ("resourceType");


--
-- Name: sys_post_postCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_post_postCode_idx" ON public.sys_post USING btree ("postCode");


--
-- Name: sys_post_postCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sys_post_postCode_key" ON public.sys_post USING btree ("postCode");


--
-- Name: sys_post_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_post_status_idx ON public.sys_post USING btree (status);


--
-- Name: sys_role_permission_permissionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_role_permission_permissionId_idx" ON public.sys_role_permission USING btree ("permissionId");


--
-- Name: sys_role_permission_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_role_permission_roleId_idx" ON public.sys_role_permission USING btree ("roleId");


--
-- Name: sys_role_roleCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_role_roleCode_idx" ON public.sys_role USING btree ("roleCode");


--
-- Name: sys_role_roleCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sys_role_roleCode_key" ON public.sys_role USING btree ("roleCode");


--
-- Name: sys_timer_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_timer_createdAt_idx" ON public.sys_timer USING btree ("createdAt");


--
-- Name: sys_timer_execution_log_startAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_timer_execution_log_startAt_idx" ON public.sys_timer_execution_log USING btree ("startAt");


--
-- Name: sys_timer_execution_log_timerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_timer_execution_log_timerId_idx" ON public.sys_timer_execution_log USING btree ("timerId");


--
-- Name: sys_timer_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_timer_status_idx ON public.sys_timer USING btree (status);


--
-- Name: sys_user_dept_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_user_dept_id_idx ON public.sys_user USING btree (dept_id);


--
-- Name: sys_user_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_user_email_idx ON public.sys_user USING btree (email);


--
-- Name: sys_user_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_user_mobile_idx ON public.sys_user USING btree (mobile);


--
-- Name: sys_user_post_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_user_post_id_idx ON public.sys_user USING btree (post_id);


--
-- Name: sys_user_role_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_user_role_roleId_idx" ON public.sys_user_role USING btree ("roleId");


--
-- Name: sys_user_role_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sys_user_role_userId_idx" ON public.sys_user_role USING btree ("userId");


--
-- Name: sys_user_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sys_user_username_idx ON public.sys_user USING btree (username);


--
-- Name: sys_user_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sys_user_username_key ON public.sys_user USING btree (username);


--
-- Name: sys_dept sys_dept_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_dept sys_dept_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dept
    ADD CONSTRAINT sys_dept_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sys_dept(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_dict_item sys_dict_item_dictTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT "sys_dict_item_dictTypeId_fkey" FOREIGN KEY ("dictTypeId") REFERENCES public.sys_dict_type(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_login_log sys_login_log_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_login_log
    ADD CONSTRAINT "sys_login_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_role_permission sys_role_permission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "sys_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.sys_permission(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_role_permission sys_role_permission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "sys_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_timer_execution_log sys_timer_execution_log_timerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_timer_execution_log
    ADD CONSTRAINT "sys_timer_execution_log_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES public.sys_timer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_user sys_user_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.sys_dept(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_user sys_user_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user
    ADD CONSTRAINT sys_user_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.sys_post(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sys_user_role sys_user_role_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT "sys_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_user_role sys_user_role_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_user_role
    ADD CONSTRAINT "sys_user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.sys_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PqgCxBmzSFxRxdoixk0Wcwj6iY2D7Hglf2vC5e7SQRG1flQnvxRk97j49Hh91RO

