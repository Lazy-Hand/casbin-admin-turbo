import { DeptService } from './dept.service';

describe('DeptService ancestors update', () => {
  const prismaMock = {
    dept: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const redisMock = {};
  const dataScopeServiceMock = {
    getDescendantDeptIds: jest.fn().mockResolvedValue([]),
    clearAllDataScopeCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.dept.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      if (where.id === 2) {
        return {
          id: 2,
          name: 'child',
          parentId: 1,
          leaderId: null,
          ancestors: '0,1',
        };
      }

      if (where.id === 9) {
        return {
          id: 9,
          ancestors: '0',
        };
      }

      return null;
    });
    prismaMock.dept.update.mockResolvedValue({ id: 2 });
    prismaMock.dept.findMany
      .mockResolvedValueOnce([{ id: 3, ancestors: '0,1,2' }])
      .mockResolvedValueOnce([]);
  });

  it('rebuilds descendant ancestors using the moved parent id', async () => {
    const service = new DeptService(
      prismaMock as never,
      redisMock as never,
      dataScopeServiceMock as never,
    );

    await service.update(2, { parentId: 9 }, 100);

    expect(prismaMock.dept.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 3 },
        data: { ancestors: '0,9,2' },
      }),
    );
  });
});
