import { DataScopeService } from './data-scope.service';

describe('DataScopeService.buildWhereClause', () => {
  it('expands DEPT_AND_CHILD to descendant department ids', async () => {
    const service = new DataScopeService(
      {
        dept: {
          findMany: jest.fn().mockResolvedValue([{ id: 3 }, { id: 5 }]),
        },
      } as never,
      {
        get: jest.fn(),
        set: jest.fn(),
        delByPattern: jest.fn(),
      } as never,
    );

    await expect(
      service.buildWhereClause({
        scope: 'DEPT_AND_CHILD',
        deptId: 3,
      }),
    ).resolves.toEqual({
      deptId: { in: [3, 5] },
    });
  });
});
