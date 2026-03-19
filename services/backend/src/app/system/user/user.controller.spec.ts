import { UserController } from './user.controller';

describe('UserController data scope wiring', () => {
  it('passes the current user id into paged queries', async () => {
    const userService = {
      findPage: jest.fn().mockResolvedValue({
        list: [],
        total: 0,
        pageNo: 1,
        pageSize: 10,
      }),
    };
    const controller = new UserController(userService as never);

    await controller.findPage({ pageNo: 1, pageSize: 10 }, { id: 9 } as never);

    expect(userService.findPage).toHaveBeenCalledWith({ pageNo: 1, pageSize: 10 }, 9);
  });

  it('passes the current user id into detail queries', async () => {
    const userService = {
      getUserDetail: jest.fn().mockResolvedValue({ id: 3 }),
    };
    const controller = new UserController(userService as never);

    await controller.getUserDetail('3', { id: 9 } as never);

    expect(userService.getUserDetail).toHaveBeenCalledWith(3, 9);
  });
});
