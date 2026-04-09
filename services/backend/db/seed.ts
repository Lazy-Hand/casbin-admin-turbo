import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log("Starting seed...");

  try {
    // 1. 创建超级管理员角色
    console.log("Creating admin role...");
    await pool.query(`
      INSERT INTO sys_role (id, "roleName", "roleCode", description, status, custom_depts, data_scope, "createdAt", "updatedAt")
      VALUES (1, '超级管理员', 'admin', '', 1, '{}', 'ALL', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // 2. 创建管理员用户 (密码: admin123456)
    console.log("Creating admin user...");
    const adminPassword = "$2b$10$kHHjzpzTOE/Fi01cy6lI4umi5l3FXrwKUgD9pBxS8BGQZZSLN1hUS";
    await pool.query(
      `
      INSERT INTO sys_user (id, username, password, avatar, email, gender, mobile, nickname, status, is_admin, "createdAt", "updatedAt")
      VALUES (1, 'admin', $1, '', '17662073174@163.com', 0, '17662073174', 'admin', 1, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
      [adminPassword],
    );

    // 3. 创建字典类型
    console.log("Creating dictionary types...");
    await pool.query(`
      INSERT INTO sys_dict_type (id, "dictName", "dictCode", description, status, "createdAt", "updatedAt")
      VALUES
        (1, '基础状态', 'BASE_STATUS', '', 1, NOW(), NOW()),
        (2, '是否', 'YES_NO', '', 1, NOW(), NOW()),
        (3, '菜单类型', 'MENU_TYPE', '', 1, NOW(), NOW()),
        (4, '资源类型', 'RESOURCE_TYPE', '', 1, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // 4. 创建字典项
    console.log("Creating dictionary items...");
    await pool.query(`
      INSERT INTO sys_dict_item (id, "dictTypeId", label, value, "colorType", sort, status, "createdAt", "updatedAt")
      VALUES
        (1, 1, '正常', '1', '', 0, 1, NOW(), NOW()),
        (2, 1, '禁用', '0', '', 1, 1, NOW(), NOW()),
        (3, 2, '是', '1', '', 0, 1, NOW(), NOW()),
        (4, 2, '否', '0', '', 0, 1, NOW(), NOW()),
        (5, 3, '菜单', 'menu', '', 0, 1, NOW(), NOW()),
        (6, 3, '页面', 'page', '', 0, 1, NOW(), NOW()),
        (7, 3, '外链', 'link', '', 0, 1, NOW(), NOW()),
        (8, 3, '内链', 'iframe', '', 0, 1, NOW(), NOW()),
        (9, 3, '新窗口', 'window', '', 0, 1, NOW(), NOW()),
        (10, 3, '分割线', 'divider', '', 0, 1, NOW(), NOW()),
        (11, 3, '分组', 'group', '', 0, 1, NOW(), NOW()),
        (12, 4, '菜单', 'menu', '', 0, 1, NOW(), NOW()),
        (13, 4, '接口', 'api', '', 0, 1, NOW(), NOW()),
        (14, 4, '按钮', 'button', '', 0, 1, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // 5. 创建权限数据
    console.log("Creating permissions...");
    await pool.query(`
      INSERT INTO sys_permission (id, "permName", "permCode", method, path, "component", "resourceType", "menuType", "parentId", icon, sort, cache, hidden, status, "createdAt", "updatedAt")
      VALUES
        (1, 'Dashboard', 'Dashboard', '', '/dashboard', '', 'menu', 'menu', 0, '', 1, 0, 0, 1, NOW(), NOW()),
        (2, '工作台', 'Workbench', '', '/dashboard/workbench', '', 'menu', 'page', 1, '', 1, 1, 0, 1, NOW(), NOW()),
        (3, '权限配置', 'Permission', '', '/permission', '', 'menu', 'menu', 0, '', 2, 0, 0, 1, NOW(), NOW()),
        (4, '资源管理', 'Menu', '', '/permission/menu', 'system/menu/index', 'menu', 'page', 3, '', 1, 1, 0, 1, NOW(), NOW()),
        (5, '角色管理', 'Role', '', '/permission/role', 'system/role/index', 'menu', 'page', 3, '', 2, 0, 0, 1, NOW(), NOW()),
        (6, '用户管理', 'User', '', '/permission/user', 'system/user/index', 'menu', 'page', 3, '', 3, 1, 0, 1, NOW(), NOW()),
        (7, '系统配置', 'System', '', '/system', '', 'menu', 'menu', 0, '', 3, 0, 0, 1, NOW(), NOW()),
        (8, '字典管理', 'Dict', '', '/dict', 'system/dictionary/index', 'menu', 'page', 7, '', 1, 0, 0, 1, NOW(), NOW()),
        (9, '新增字典', 'DICT_ADD', '', '', '', 'button', NULL, 8, '', 0, 0, 0, 1, NOW(), NOW()),
        (10, '字典项', 'DICT_ITEM', '', '', '', 'button', NULL, 8, '', 0, 0, 0, 1, NOW(), NOW()),
        (11, '修改字典', 'DICT_EDIT', '', '', '', 'button', NULL, 8, '', 0, 0, 0, 1, NOW(), NOW()),
        (12, '删除字典', 'DICT_DELETE', '', '', '', 'button', NULL, 8, '', 0, 0, 0, 1, NOW(), NOW()),
        (13, '新增资源', 'MENU_ADD', '', '', '', 'button', NULL, 4, '', 0, 0, 0, 1, NOW(), NOW()),
        (14, '按钮管理', 'MENU_BUTTON', '', '', '', 'button', NULL, 4, '', 0, 0, 0, 1, NOW(), NOW()),
        (15, '修改资源', 'MENU_EDIT', '', '', '', 'button', NULL, 4, '', 0, 0, 0, 1, NOW(), NOW()),
        (16, '删除资源', 'MENU_DELETE', '', '', '', 'button', NULL, 4, '', 0, 0, 0, 1, NOW(), NOW()),
        (17, '获取部门树', 'dept:list', 'GET', '/api/depts/tree', '', 'api', NULL, 0, '', 0, 0, 0, 1, NOW(), NOW()),
        (18, '用户新增', 'USER_ADD', '', '', '', 'button', NULL, 6, '', 0, 0, 0, 1, NOW(), NOW()),
        (19, '角色新增', 'ROLE_ADD', '', '', '', 'button', NULL, 5, '', 0, 0, 0, 1, NOW(), NOW()),
        (20, '分配资源权限', 'ROLE_PERMISSION', '', '', '', 'button', NULL, 5, '', 0, 0, 0, 1, NOW(), NOW()),
        (21, '角色修改', 'ROLE_EDIT', '', '', '', 'button', NULL, 5, '', 0, 0, 0, 1, NOW(), NOW()),
        (22, '角色删除', 'ROLE_DELETE', '', '', '', 'button', NULL, 5, '', 0, 0, 0, 1, NOW(), NOW()),
        (23, '用户修改', 'USER_EDIT', '', '', '', 'button', NULL, 6, '', 0, 0, 0, 1, NOW(), NOW()),
        (24, '用户删除', 'USER_DELETE', '', '', '', 'button', NULL, 6, '', 0, 0, 0, 1, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // 6. 创建用户角色关联
    console.log("Creating user-role relations...");
    await pool.query(`
      INSERT INTO sys_user_role ("userId", "roleId")
      VALUES (1, 1)
      ON CONFLICT DO NOTHING
    `);

    // 7. 创建角色权限关联
    console.log("Creating role-permission relations...");
    await pool.query(`
      INSERT INTO sys_role_permission ("roleId", "permissionId")
      VALUES
        (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
        (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17)
      ON CONFLICT DO NOTHING
    `);

    // 8. 重置序列
    console.log("Resetting sequences...");
    await pool.query(`SELECT setval('sys_dict_type_id_seq', 4, true)`);
    await pool.query(`SELECT setval('sys_dict_item_id_seq', 14, true)`);
    await pool.query(`SELECT setval('sys_permission_id_seq', 24, true)`);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
