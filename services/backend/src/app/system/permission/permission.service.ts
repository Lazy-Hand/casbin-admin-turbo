import { Injectable, Inject, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { CACHE_MANAGER } from "@nestjs/cache-manager"
import type { Cache } from "cache-manager"
import { PrismaService } from "nestjs-prisma"
import type { PermissionInfo } from "../../library/casl/types"
import { matchPath } from "../../library/casl/utils"
import { MenuType, ResourceType, type Prisma } from "@prisma/client"

/**
 * Permission Service
 * 提供权限查询、缓存管理和权限检查功能
 */
@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name)
  private globalPermissionsLoaded = false
  private readonly cacheTtl: number
  private readonly slowQueryThreshold: number
  private readonly enablePreload: boolean
  private readonly enableBatchLoad: boolean
  private readonly globalPrefix?: string

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // 从配置中读取 CASL 相关配置
    this.cacheTtl = this.configService.get<number>("casl.cache.ttl", 1800000)
    this.slowQueryThreshold = this.configService.get<number>("casl.performance.slowQueryThreshold", 100)
    this.enablePreload = this.configService.get<boolean>("casl.performance.enablePreload", true)
    this.enableBatchLoad = this.configService.get<boolean>("casl.performance.enableBatchLoad", true)
    this.globalPrefix = this.configService.get<string>("globalPrefix")

    this.logger.log(
      `CASL 配置: cacheTtl=${this.cacheTtl}ms, slowQueryThreshold=${this.slowQueryThreshold}ms, preload=${this.enablePreload}, batchLoad=${this.enableBatchLoad}, globalPrefix=${this.globalPrefix || "none"}`,
    )
  }

  /**
   * 应用启动时预加载权限配置
   * 可以在 AppModule 的 onModuleInit 中调用
   */
  async preloadPermissions(): Promise<void> {
    if (!this.enablePreload) {
      this.logger.log("权限预加载已禁用")
      return
    }

    if (this.globalPermissionsLoaded) {
      return
    }

    try {
      const startTime = Date.now()

      // 加载所有权限到缓存（只加载 API 类型权限）
      const permissions = await this.prisma.permission.findMany({
        where: {
          resourceType: ResourceType.api,
        },
      })
      await this.cacheManager.set(
        "global:permissions",
        permissions,
        3600000, // 1小时
      )

      // 加载所有角色到缓存
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
      await this.cacheManager.set("global:roles", roles, 3600000)

      const duration = Date.now() - startTime
      this.globalPermissionsLoaded = true
      this.logger.log(`权限预加载成功: ${permissions.length} 个权限, ${roles.length} 个角色, 耗时 ${duration}ms`)
      // 记录加载的权限code和角色code，方便排查权限问题
      const permCodes = permissions.map((p) => p.permCode).join(", ")
      const roleCodes = roles.map((r) => r.roleCode).join(", ")
      this.logger.log(`预加载权限代码: ${permCodes}`)
      this.logger.log(`预加载角色代码: ${roleCodes}`)
    } catch (error) {
      this.logger.error("预加载权限配置失败:", error)
    }
  }

  /**
   * 获取用户所有权限
   * 使用缓存机制提高性能
   * @param userId 用户ID
   * @returns 权限列表
   */
  async getUserPermissions(userId: number): Promise<PermissionInfo[]> {
    const startTime = Date.now()
    const cacheKey = `user:${userId}:permissions`

    try {
      // 尝试从缓存获取
      let permissions = await this.cacheManager.get<PermissionInfo[]>(cacheKey)

      if (!permissions) {
        // 从数据库加载
        permissions = await this.loadUserPermissionsFromDB(userId)

        // 存入缓存
        await this.cacheManager.set(cacheKey, permissions, this.cacheTtl)
      }

      const duration = Date.now() - startTime

      // 记录慢查询
      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`权限查询缓慢: ${duration}ms, userId=${userId}, cached=${!!permissions}`)
      }

      return permissions || []
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`权限查询失败: ${duration}ms, userId=${userId}`, error)
      throw error
    }
  }

  /**
   * 从数据库加载用户权限
   * @param userId 用户ID
   * @returns 权限列表
   */
  private async loadUserPermissionsFromDB(userId: number): Promise<PermissionInfo[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return []
    }

    // 收集所有权限（去重）
    const permissionMap = new Map<number, PermissionInfo>()

    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        const perm = rolePermission.permission as any
        if (!permissionMap.has(perm.id)) {
          permissionMap.set(perm.id, {
            id: perm.id,
            permCode: perm.permCode,
            permName: perm.permName,
            resourceType: perm.resourceType as "api" | "menu" | "button",
            method: perm.method,
            path: perm.path,
            menuType: perm.menuType || undefined,
          })
        }
      }
    }

    return Array.from(permissionMap.values())
  }

  /**
   * 获取用户菜单权限
   * @param userId 用户ID
   * @returns 菜单权限列表
   */
  async getUserMenuPermissions(userId: number): Promise<PermissionInfo[]> {
    const permissions = await this.getUserPermissions(userId)
    return permissions.filter((p) => p.resourceType === "menu")
  }

  /**
   * 获取用户 API 权限
   * @param userId 用户ID
   * @returns API 权限列表
   */
  async getUserApiPermissions(userId: number): Promise<PermissionInfo[]> {
    const permissions = await this.getUserPermissions(userId)
    return permissions.filter((p) => p.resourceType === "api")
  }

  /**
   * 检查用户是否有特定权限
   * @param userId 用户ID
   * @param permCode 权限代码
   * @returns 是否有权限
   */
  async hasPermission(userId: number, permCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId)
    return permissions.some((p) => p.permCode === permCode)
  }

  /**
   * 检查用户是否有特定角色
   * @param userId 用户ID
   * @param roleCode 角色代码
   * @returns 是否有角色
   */
  async hasRole(userId: number, roleCode: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return user?.roles.some((ur) => ur.role.roleCode === roleCode) ?? false
  }

  /**
   * 清除用户权限缓存
   * @param userId 用户ID
   */
  async clearUserPermissionsCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}:permissions`
    await this.cacheManager.del(cacheKey)
  }

  /**
   * 清除角色相关的所有用户权限缓存
   * @param roleId 角色ID
   */
  async clearRolePermissionsCache(roleId: number): Promise<void> {
    // 查找所有拥有该角色的用户
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
    })

    // 清除所有相关用户的缓存
    for (const ur of userRoles) {
      await this.clearUserPermissionsCache(ur.userId)
    }
  }

  /**
   * 批量获取多个用户的权限
   * 优化性能，一次查询获取多个用户的权限
   * @param userIds 用户ID数组
   * @returns 用户ID到权限列表的映射
   */
  async getUserPermissionsBatch(userIds: number[]): Promise<Map<number, PermissionInfo[]>> {
    if (!this.enableBatchLoad) {
      this.logger.warn("批量加载已禁用，使用单个查询")
      const result = new Map<number, PermissionInfo[]>()
      for (const userId of userIds) {
        const permissions = await this.getUserPermissions(userId)
        result.set(userId, permissions)
      }
      return result
    }

    const startTime = Date.now()
    const result = new Map<number, PermissionInfo[]>()

    try {
      // 先尝试从缓存获取
      const uncachedUserIds: number[] = []
      for (const userId of userIds) {
        const cacheKey = `user:${userId}:permissions`
        const cached = await this.cacheManager.get<PermissionInfo[]>(cacheKey)
        if (cached) {
          result.set(userId, cached)
        } else {
          uncachedUserIds.push(userId)
        }
      }

      // 如果所有用户都在缓存中，直接返回
      if (uncachedUserIds.length === 0) {
        const duration = Date.now() - startTime
        this.logger.debug(`批量加载完成（全部缓存命中）: ${userIds.length} 个用户, 耗时 ${duration}ms`)
        return result
      }

      // 批量查询未缓存的用户
      const users = await this.prisma.user.findMany({
        where: { id: { in: uncachedUserIds } },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // 处理每个用户的权限
      for (const user of users) {
        const permissionMap = new Map<number, PermissionInfo>()

        for (const userRole of user.roles) {
          for (const rolePermission of userRole.role.permissions) {
            const perm = rolePermission.permission as any
            if (!permissionMap.has(perm.id)) {
              permissionMap.set(perm.id, {
                id: perm.id,
                permCode: perm.permCode,
                permName: perm.permName,
                resourceType: perm.resourceType as "api" | "menu" | "button",
                method: perm.method,
                path: perm.path,
                menuType: perm.menuType || undefined,
              })
            }
          }
        }

        const permissions = Array.from(permissionMap.values())
        result.set(user.id, permissions)

        // 存入缓存
        const cacheKey = `user:${user.id}:permissions`
        await this.cacheManager.set(cacheKey, permissions, this.cacheTtl)
      }

      const duration = Date.now() - startTime
      this.logger.log(`批量加载完成: ${userIds.length} 个用户 (${uncachedUserIds.length} 个从数据库加载), 耗时 ${duration}ms`)

      // 记录慢查询
      if (duration > this.slowQueryThreshold * 2) {
        this.logger.warn(`批量加载缓慢: ${duration}ms, userIds=${userIds.length}`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`批量加载失败: ${duration}ms, userIds=${userIds.length}`, error)
      throw error
    }
  }

  /**
   * 检查用户是否有访问特定路径的权限
   * @param userId 用户ID
   * @param method HTTP 方法
   * @param path 请求路径（可能包含 global prefix）
   * @returns 是否有权限
   */
  async hasPathPermission(userId: number, method: string, path: string): Promise<boolean> {
    const permissions = await this.getUserApiPermissions(userId)

    return permissions.some((p) => {
      // 检查 HTTP 方法
      if (p.method && p.method !== method) {
        return false
      }

      // 检查路径（考虑 global prefix）
      return matchPath(path, p.path, this.globalPrefix)
    })
  }

  // ==================== 权限管理 ====================

  /**
   * 获取所有权限
   * @returns 权限列表
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resourceType: "asc" }, { permCode: "asc" }],
    })
  }

  /**
   * 根据 ID 获取权限详情
   * @param id 权限ID
   * @returns 权限详情
   */
  async getPermissionById(id: number) {
    return this.prisma.permission.findUnique({
      where: { id },
    })
  }

  /**
   * 获取所有菜单权限
   * @param query 查询参数
   * @returns 菜单权限树形列表
   */
  async getMenuPermissions(query: { permName?: string; status?: number }) {
    const where: Prisma.PermissionWhereInput = {
      resourceType: ResourceType.menu,
    }

    if (query.permName) {
      where.permName = {
        contains: query.permName,
      }
    }

    if (query.status !== undefined) {
      where.status = query.status
    }

    const permissions = await this.prisma.permission.findMany({
      where,
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    })

    return this.buildMenuTree(permissions)
  }

  /**
   * 获取菜单和按钮权限
   * @param query 查询参数
   * @returns 菜单+按钮树形列表
   */
  async getMenuAndButtonPermissions(query: { permName?: string; status?: number }) {
    const { permName, status } = query
    const statusFilter =
      status !== undefined
        ? {
            status,
          }
        : {}

    // 无名称筛选时，直接查询 menu + button
    if (!permName) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          ...statusFilter,
          resourceType: {
            in: [ResourceType.menu, ResourceType.button],
          },
        },
        orderBy: [{ sort: "asc" }, { id: "asc" }],
      })

      return this.buildMenuTree(permissions)
    }

    // 有名称筛选时，避免出现“命中按钮但父菜单未命中导致按钮被树构建丢弃”
    const [matchedMenus, matchedButtons] = await Promise.all([
      this.prisma.permission.findMany({
        where: {
          ...statusFilter,
          resourceType: ResourceType.menu,
          permName: { contains: permName },
        },
        select: { id: true },
      }),
      this.prisma.permission.findMany({
        where: {
          ...statusFilter,
          resourceType: ResourceType.button,
          permName: { contains: permName },
        },
        select: { id: true, parentId: true },
      }),
    ])

    const matchedMenuIds = new Set<number>(matchedMenus.map((item) => item.id))
    const matchedButtonIds = matchedButtons.map((item) => item.id)
    for (const button of matchedButtons) {
      if (button.parentId) {
        matchedMenuIds.add(button.parentId)
      }
    }

    const menuIds = Array.from(matchedMenuIds)
    if (menuIds.length === 0 && matchedButtonIds.length === 0) {
      return []
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        ...statusFilter,
        OR: [
          {
            resourceType: ResourceType.menu,
            id: {
              in: menuIds.length > 0 ? menuIds : [-1],
            },
          },
          {
            resourceType: ResourceType.button,
            id: {
              in: matchedButtonIds.length > 0 ? matchedButtonIds : [-1],
            },
          },
          {
            resourceType: ResourceType.button,
            parentId: {
              in: matchedMenus.length > 0 ? matchedMenus.map((item) => item.id) : [-1],
            },
          },
        ],
      },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    })

    return this.buildMenuTree(permissions)
  }

  /**
   * 分页查询按钮权限
   * 仅查询 resourceType=button 且挂载在指定父级菜单下的权限
   */
  async getButtonPermissionsPage(query: { pageNo?: number; pageSize?: number; permName?: string; permCode?: string; parentId: number }) {
    const { pageNo = 1, pageSize = 10, permName, permCode, parentId } = query
    const skip = (pageNo - 1) * pageSize
    const take = pageSize

    const where: Prisma.PermissionWhereInput = {
      resourceType: ResourceType.button,
      parentId,
    }

    if (permName) {
      where.permName = {
        contains: permName,
      }
    }

    if (permCode) {
      where.permCode = {
        contains: permCode,
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: "asc" }, { id: "asc" }],
      }),
      this.prisma.permission.count({ where }),
    ])

    return {
      list,
      total,
      pageNo,
      pageSize,
    }
  }

  /**
   * 将扁平菜单列表转换为树形结构
   * @param permissions 权限列表
   * @returns 树形结构
   */
  private buildMenuTree(permissions: any[]): any[] {
    const map = new Map<number, any>()
    const roots: any[] = []

    for (const perm of permissions) {
      map.set(perm.id, { ...perm, children: [] })
    }

    for (const perm of permissions) {
      const node = map.get(perm.id)
      if (!node) continue

      if (perm.parentId === null || perm.parentId === 0) {
        roots.push(node)
      } else {
        const parent = map.get(perm.parentId)
        if (parent) {
          parent.children.push(node)
        }
      }
    }

    const removeEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        const result = { ...node }
        if (result.children && result.children.length === 0) {
          delete result.children
        } else if (result.children) {
          result.children = removeEmptyChildren(result.children)
        }
        return result
      })
    }

    return removeEmptyChildren(roots)
  }

  /**
   * 创建权限
   * @param data 权限数据
   * @returns 创建的权限
   */
  async createPermission(data: {
    permName: string
    permCode: string
    method?: string
    resourceType: ResourceType
    menuType?: MenuType
    path?: string
    component?: string
    icon?: string
    sort?: number
    cache?: number
    hidden?: number
    frameUrl?: string
    status?: number
    parentId?: number
  }) {
    const permission = await this.prisma.permission.create({
      data: {
        permName: data.permName,
        permCode: data.permCode,
        method: data.method || "",
        resourceType: data.resourceType,
        menuType: data.menuType || null,
        path: data.path || "",
        component: data.component || "",
        icon: data.icon || "",
        sort: data.sort ?? 0,
        cache: data.cache ?? 0,
        hidden: data.hidden ?? 0,
        frameUrl: data.frameUrl || "",
        status: data.status ?? 1,
        parentId: data.parentId && data.parentId !== 0 ? data.parentId : null,
      },
    })

    // 清除全局权限缓存
    await this.cacheManager.del("global:permissions")

    return permission
  }

  /**
   * 更新权限
   * @param permissionId 权限ID
   * @param data 更新数据
   * @returns 更新后的权限
   */
  async updatePermission(
    permissionId: number,
    data: {
      permName?: string
      permCode?: string
      method?: string
      resourceType?: ResourceType
      menuType?: MenuType
      path?: string
      component?: string
      icon?: string
      sort?: number
      cache?: number
      hidden?: number
      frameUrl?: string
      status?: number
      parentId?: number
    },
  ) {
    // 处理 parentId 为 0 的情况，应设为 null
    const updateData: any = { ...data }
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId && data.parentId > 0 ? data.parentId : null
    }

    const permission = await this.prisma.permission.update({
      where: { id: permissionId },
      data: updateData,
    })

    // 清除全局权限缓存
    await this.cacheManager.del("global:permissions")

    // 清除所有使用此权限的角色的缓存
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { permissionId },
    })
    for (const rp of rolePermissions) {
      await this.clearRolePermissionsCache(rp.roleId)
    }

    return permission
  }

  /**
   * 删除权限
   * @param permissionId 权限ID
   * @returns 删除的权限
   */
  async deletePermission(permissionId: number) {
    // 先获取相关角色，用于清除缓存
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { permissionId },
    })

    const permission = await this.prisma.permission.delete({
      where: { id: permissionId },
    })

    // 清除全局权限缓存
    await this.cacheManager.del("global:permissions")

    // 清除所有使用此权限的角色的缓存
    for (const rp of rolePermissions) {
      await this.clearRolePermissionsCache(rp.roleId)
    }

    return permission
  }
}
