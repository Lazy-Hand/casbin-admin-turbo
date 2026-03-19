import { RoleService } from './role.service';

describe('RoleService status handling', () => {
  const txMock = {
    role: {
      create: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const prismaMock = {
    dept: {
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(async (callback: (tx: typeof txMock) => unknown) => callback(txMock)),
  };

  const dataScopeServiceMock = {
    clearAllDataScopeCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    txMock.role.create.mockResolvedValue({ id: 1 });
    txMock.role.update.mockResolvedValue({ id: 1 });
  });

  it('preserves status=0 on create', async () => {
    const service = new RoleService(prismaMock as never, dataScopeServiceMock as never);

    await service.create({
      roleName: 'guest',
      roleCode: 'guest',
      status: 0,
    });

    expect(txMock.role.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 0,
        }),
      }),
    );
  });

  it('preserves status=0 on update', async () => {
    const service = new RoleService(prismaMock as never, dataScopeServiceMock as never);

    await service.update(5, {
      status: 0,
    });

    expect(txMock.role.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 0,
        }),
      }),
    );
  });
});
