import { applySoftDeleteFilter } from './prisma-audit.extension';

describe('applySoftDeleteFilter', () => {
  it('adds soft delete filtering to non-unique query args', () => {
    const args: { where?: Record<string, unknown> } = {
      where: { id: 1 },
    };

    applySoftDeleteFilter('User', args);

    expect(args.where).toEqual({
      AND: [{ id: 1 }, { deletedAt: null }],
    });
  });
});
