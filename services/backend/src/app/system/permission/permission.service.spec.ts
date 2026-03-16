import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleService } from '../../library/drizzle';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let selectMock: jest.Mock;

  const createSelectChain = (result: unknown) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  beforeEach(async () => {
    selectMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: DrizzleService,
          useValue: {
            db: {
              select: selectMock,
            },
          },
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
        resourceType: 'button',
        parentId: 10,
      },
    ];

    selectMock
      .mockReturnValueOnce(createSelectChain(list))
      .mockReturnValueOnce(createSelectChain([{ total: 1 }]));

    const result = await service.getButtonPermissionsPage({
      pageNo: 2,
      pageSize: 5,
      parentId: 10,
      permName: '新增',
      permCode: 'add',
    });

    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      list,
      total: 1,
      pageNo: 2,
      pageSize: 5,
    });
  });

  it('should query menu and button permissions together', async () => {
    selectMock
      .mockReturnValueOnce(createSelectChain([{ id: 100 }]))
      .mockReturnValueOnce(createSelectChain([{ id: 101, parentId: 100 }]))
      .mockReturnValueOnce(createSelectChain([
        {
          id: 100,
          permName: '用户管理',
          permCode: 'system:user',
          resourceType: 'menu',
          parentId: null,
          sort: 1,
        },
        {
          id: 101,
          permName: '新增用户按钮',
          permCode: 'system:user:add',
          resourceType: 'button',
          parentId: 100,
          sort: 1,
        },
      ]));

    const result = await service.getMenuAndButtonPermissions({
      permName: '用户',
      status: 1,
    });

    expect(selectMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual([
      {
        id: 100,
        permName: '用户管理',
        permCode: 'system:user',
        resourceType: 'menu',
        parentId: null,
        sort: 1,
        children: [
          {
            id: 101,
            permName: '新增用户按钮',
            permCode: 'system:user:add',
            resourceType: 'button',
            parentId: 100,
            sort: 1,
          },
        ],
      },
    ]);
  });

  it('should return parent menu when only button name matches', async () => {
    selectMock
      .mockReturnValueOnce(createSelectChain([]))
      .mockReturnValueOnce(createSelectChain([{ id: 201, parentId: 200 }]))
      .mockReturnValueOnce(createSelectChain([
        {
          id: 200,
          permName: '订单管理',
          permCode: 'system:order',
          resourceType: 'menu',
          parentId: null,
          sort: 1,
        },
        {
          id: 201,
          permName: '导出订单',
          permCode: 'system:order:export',
          resourceType: 'button',
          parentId: 200,
          sort: 2,
        },
      ]));

    const result = await service.getMenuAndButtonPermissions({
      permName: '导出',
      status: 1,
    });

    expect(result).toEqual([
      {
        id: 200,
        permName: '订单管理',
        permCode: 'system:order',
        resourceType: 'menu',
        parentId: null,
        sort: 1,
        children: [
          {
            id: 201,
            permName: '导出订单',
            permCode: 'system:order:export',
            resourceType: 'button',
            parentId: 200,
            sort: 2,
          },
        ],
      },
    ]);
  });
});
