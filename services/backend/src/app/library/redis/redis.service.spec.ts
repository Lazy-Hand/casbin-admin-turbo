import { RedisService } from './redis.service';

describe('RedisService.delByPattern', () => {
  it('uses SCAN instead of KEYS to delete matching entries', async () => {
    const del = jest.fn().mockResolvedValue(2);
    const scan = jest
      .fn()
      .mockResolvedValueOnce(['1', ['app:user:1', 'app:user:2']])
      .mockResolvedValueOnce(['0', []]);

    const service = Object.create(RedisService.prototype) as RedisService & {
      client: { scan: jest.Mock; del: jest.Mock };
    };
    Object.defineProperty(service, 'client', {
      value: { scan, del },
      writable: true,
    });

    const deleted = await service.delByPattern('user:*');

    expect(scan).toHaveBeenCalledWith(
      '0',
      'MATCH',
      'user:*',
      'COUNT',
      100,
    );
    expect(del).toHaveBeenCalledWith('app:user:1', 'app:user:2');
    expect(deleted).toBe(2);
  });
});
