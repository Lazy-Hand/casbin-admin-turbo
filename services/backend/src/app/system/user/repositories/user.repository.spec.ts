import { UserRepository } from './user.repository';

describe('UserRepository data scope fallback', () => {
  it('fails closed when data scope lookup throws', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const repository = new UserRepository(
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({ isAdmin: false }),
          findMany,
          count,
        },
      } as never,
      {
        getUserDataScope: jest.fn().mockRejectedValue(new Error('boom')),
        buildWhereClause: jest.fn(),
      } as never,
    );

    await repository.findPage(7, { pageNo: 1, pageSize: 10 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ deletedAt: null }, { id: -1 }],
        },
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: {
        AND: [{ deletedAt: null }, { id: -1 }],
      },
    });
  });
});
