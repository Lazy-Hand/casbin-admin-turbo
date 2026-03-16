import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const bcrypt = jest.requireMock('bcrypt') as {
  hash: jest.Mock;
};

describe('UserService password handling', () => {
  const txMock = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const prismaMock = {
    dept: {
      findUnique: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: typeof txMock) => unknown) =>
      callback(txMock),
    ),
  };

  const dataScopeServiceMock = {};
  const userRepositoryMock = {
    findPage: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.dept.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.post.findUnique.mockResolvedValue({ id: 2 });
    txMock.user.create.mockResolvedValue({ id: 1 });
    txMock.user.update.mockResolvedValue({ id: 1 });
    bcrypt.hash.mockResolvedValue('hashed-password');
    userRepositoryMock.findPage.mockReset();
    userRepositoryMock.findOne.mockReset();
  });

  afterEach(() => {
    bcrypt.hash.mockReset();
  });

  it('hashes passwords before creating users', async () => {
    const service = new UserService(
      prismaMock as never,
      dataScopeServiceMock as never,
      userRepositoryMock as never,
    );

    await service.create({
      username: 'alice',
      password: 'plain-password',
      nickname: 'Alice',
      mobile: '13800000000',
      roles: [],
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
        }),
      }),
    );
  });

  it('rejects creating users without a password', async () => {
    const service = new UserService(
      prismaMock as never,
      dataScopeServiceMock as never,
      userRepositoryMock as never,
    );

    await expect(
      service.create({
        username: 'alice',
        nickname: 'Alice',
        mobile: '13800000000',
        roles: [],
      } as never),
    ).rejects.toThrow('密码不能为空');

    expect(txMock.user.create).not.toHaveBeenCalled();
  });

  it('hashes passwords before updating users', async () => {
    const service = new UserService(
      prismaMock as never,
      dataScopeServiceMock as never,
      userRepositoryMock as never,
    );

    await service.update(7, {
      password: 'new-plain-password',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('new-plain-password', 10);
    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
        }),
      }),
    );
  });

  it('preserves zero values when updating gender and status', async () => {
    const service = new UserService(
      prismaMock as never,
      dataScopeServiceMock as never,
      userRepositoryMock as never,
    );

    await service.update(7, {
      gender: 0,
      status: 0,
    });

    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gender: 0,
          status: 0,
        }),
      }),
    );
  });

  it('delegates paged queries to the scoped repository', async () => {
    userRepositoryMock.findPage.mockResolvedValue({
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    });
    const service = new UserService(
      prismaMock as never,
      dataScopeServiceMock as never,
      userRepositoryMock as never,
    );

    await service.findPage({ pageNo: 1, pageSize: 10 }, 11);

    expect(userRepositoryMock.findPage).toHaveBeenCalledWith(11, {
      pageNo: 1,
      pageSize: 10,
      deptId: undefined,
      postId: undefined,
    });
  });
});
