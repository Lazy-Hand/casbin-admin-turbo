jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';
import { TimerService } from './timer.service';
import { lookup } from 'node:dns/promises';

const lookupMock = jest.mocked(lookup);

describe('TimerService guards dangerous targets', () => {
  const prismaMock = {
    timer: {
      create: jest.fn(),
    },
  };
  const schedulerRegistryMock = {
    deleteCronJob: jest.fn(),
    addCronJob: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('rejects script tasks before persisting them', async () => {
    const service = new TimerService(prismaMock as never, schedulerRegistryMock as never);

    await expect(
      service.create({
        name: 'danger',
        cron: '0 * * * *',
        taskType: 'SCRIPT',
        target: 'rm -rf /',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.timer.create).not.toHaveBeenCalled();
  });

  it('rejects private network http targets', async () => {
    const service = new TimerService(prismaMock as never, schedulerRegistryMock as never);

    await expect(
      service.create({
        name: 'internal call',
        cron: '0 * * * *',
        taskType: 'HTTP',
        target: 'http://127.0.0.1:3000/internal',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.timer.create).not.toHaveBeenCalled();
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.8', family: 4 }]);

    const service = new TimerService(prismaMock as never, schedulerRegistryMock as never);

    await expect(
      service.create({
        name: 'internal dns',
        cron: '0 * * * *',
        taskType: 'HTTP',
        target: 'https://internal.example.com/jobs',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
