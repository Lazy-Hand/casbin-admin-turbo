import { OperationLogService } from "./operation-log.service";

describe("OperationLogService queue flushing", () => {
  it("drains logs from redis before persisting them", async () => {
    const drainList = jest.fn().mockResolvedValue([
      { username: "alice", module: "user", operation: "CREATE", status: 1 },
      { username: "bob", module: "role", operation: "UPDATE", status: 1 },
    ]);
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    const service = new OperationLogService(
      {
        operationLog: {
          createMany,
        },
      } as never,
      {
        drainList,
      } as never,
    );

    const count = await service.flushLogQueue();

    expect(drainList).toHaveBeenCalledWith("operation-log:queue", 100);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { username: "alice", module: "user", operation: "CREATE", status: 1 },
        { username: "bob", module: "role", operation: "UPDATE", status: 1 },
      ],
      skipDuplicates: true,
    });
    expect(count).toBe(2);
  });
});
