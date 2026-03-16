import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ResourceType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let prismaMock: {
    permission: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      permission: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, fallback: any) => {
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should query button permissions by parentId with pagination and filters', async () => {
    const list = [
      {
        id: 1,
        permName: '新增按钮',
        permCode: 'system:user:add',
        resourceType: ResourceType.button,
        parentId: 10,
      },
    ];

    prismaMock.permission.findMany.mockResolvedValue(list);
    prismaMock.permission.count.mockResolvedValue(1);

    const result = await service.getButtonPermissionsPage({
      pageNo: 2,
      pageSize: 5,
      parentId: 10,
      permName: '新增',
      permCode: 'add',
    });

    expect(prismaMock.permission.findMany).toHaveBeenCalledWith({
      where: {
        resourceType: ResourceType.button,
        parentId: 10,
        permName: { contains: '新增' },
        permCode: { contains: 'add' },
      },
      skip: 5,
      take: 5,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    expect(prismaMock.permission.count).toHaveBeenCalledWith({
      where: {
        resourceType: ResourceType.button,
        parentId: 10,
        permName: { contains: '新增' },
        permCode: { contains: 'add' },
      },
    });
    expect(result).toEqual({
      list,
      total: 1,
      pageNo: 2,
      pageSize: 5,
    });
  });

  it('should query menu and button permissions together', async () => {
    prismaMock.permission.findMany
      .mockResolvedValueOnce([{ id: 100 }])
      .mockResolvedValueOnce([{ id: 101, parentId: 100 }])
      .mockResolvedValueOnce([
        {
          id: 100,
          permName: '用户管理',
          permCode: 'system:user',
          resourceType: ResourceType.menu,
          parentId: null,
          sort: 1,
        },
        {
          id: 101,
          permName: '新增用户按钮',
          permCode: 'system:user:add',
          resourceType: ResourceType.button,
          parentId: 100,
          sort: 1,
        },
      ]);

    const result = await service.getMenuAndButtonPermissions({
      permName: '用户',
      status: 1,
    });

    expect(prismaMock.permission.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        resourceType: ResourceType.menu,
        permName: { contains: '用户' },
        status: 1,
      },
      select: { id: true },
    });
    expect(prismaMock.permission.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        resourceType: ResourceType.button,
        permName: { contains: '用户' },
        status: 1,
      },
      select: { id: true, parentId: true },
    });
    expect(prismaMock.permission.findMany).toHaveBeenNthCalledWith(3, {
      where: {
        status: 1,
        OR: [
          {
            resourceType: ResourceType.menu,
            id: {
              in: [100],
            },
          },
          {
            resourceType: ResourceType.button,
            id: {
              in: [101],
            },
          },
          {
            resourceType: ResourceType.button,
            parentId: {
              in: [100],
            },
          },
        ],
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    expect(result).toEqual([
      {
        id: 100,
        permName: '用户管理',
        permCode: 'system:user',
        resourceType: ResourceType.menu,
        parentId: null,
        sort: 1,
        children: [
          {
            id: 101,
            permName: '新增用户按钮',
            permCode: 'system:user:add',
            resourceType: ResourceType.button,
            parentId: 100,
            sort: 1,
          },
        ],
      },
    ]);
  });

  it('should return parent menu when only button name matches', async () => {
    prismaMock.permission.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 201, parentId: 200 }])
      .mockResolvedValueOnce([
        {
          id: 200,
          permName: '订单管理',
          permCode: 'system:order',
          resourceType: ResourceType.menu,
          parentId: null,
          sort: 1,
        },
        {
          id: 201,
          permName: '导出订单',
          permCode: 'system:order:export',
          resourceType: ResourceType.button,
          parentId: 200,
          sort: 2,
        },
      ]);

    const result = await service.getMenuAndButtonPermissions({
      permName: '导出',
      status: 1,
    });

    expect(result).toEqual([
      {
        id: 200,
        permName: '订单管理',
        permCode: 'system:order',
        resourceType: ResourceType.menu,
        parentId: null,
        sort: 1,
        children: [
          {
            id: 201,
            permName: '导出订单',
            permCode: 'system:order:export',
            resourceType: ResourceType.button,
            parentId: 200,
            sort: 2,
          },
        ],
      },
    ]);
  });
});
