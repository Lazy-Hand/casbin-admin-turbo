import { Prisma, PrismaClient } from '@prisma/client';
import { asyncLocalStorage } from './user-context';

const MODELS_WITH_AUDIT = [
  'User',
  'Role',
  'Permission',
  'SysFile',
  'Timer',
  'DictType',
  'DictItem',
];

/** 有 deletedAt 软删除字段的模型，查询时自动过滤已删除数据 */
const MODELS_WITH_SOFT_DELETE = [
  'User',
  'Role',
  'Permission',
  'SysFile',
  'Timer',
  'DictType',
  'DictItem',
];

const MODEL_DELEGATE_KEYS: Record<string, string> = {
  User: 'user',
  Role: 'role',
  Permission: 'permission',
  SysFile: 'sysFile',
  Timer: 'timer',
  DictType: 'dictType',
  DictItem: 'dictItem',
};

/** 为 where 条件合并 deletedAt: null，只查未软删除的数据 */
export function applySoftDeleteFilter(model: string, args: any) {
  if (!MODELS_WITH_SOFT_DELETE.includes(model)) return;
  const filter = { deletedAt: null };
  args.where = args.where ? { AND: [args.where, filter] } : filter;
}

/** 创建审计扩展，需要传入 base 客户端以在 delete 时执行 update 软删除 */
export function createAuditExtension(baseClient: PrismaClient) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          applySoftDeleteFilter(model, args);
          return query(args);
        },
        async findFirst({ model, args, query }) {
          applySoftDeleteFilter(model, args);
          return query(args);
        },
        async findUnique({ model, args, query }) {
          return query(args);
        },
        async count({ model, args, query }) {
          applySoftDeleteFilter(model, args);
          return query(args);
        },
        async aggregate({ model, args, query }) {
          applySoftDeleteFilter(model, args);
          return query(args);
        },
        async create({ model, args, query }) {
          const store = asyncLocalStorage.getStore();
          const userId = store?.userId;

          if (userId && MODELS_WITH_AUDIT.includes(model)) {
            args.data = {
              ...args.data,
              createdBy: userId,
              updatedBy: userId,
            };
          }
          return query(args);
        },

        async update({ model, args, query }) {
          const store = asyncLocalStorage.getStore();
          const userId = store?.userId;

          if (userId && MODELS_WITH_AUDIT.includes(model)) {
            args.data = {
              ...args.data,
              updatedBy: userId,
            };
          }
          return query(args);
        },

        async updateMany({ model, args, query }) {
          const store = asyncLocalStorage.getStore();
          const userId = store?.userId;

          if (userId && MODELS_WITH_AUDIT.includes(model)) {
            args.data = {
              ...args.data,
              updatedBy: userId,
            };
          }
          return query(args);
        },

        async delete({ model, args, query }) {
          const store = asyncLocalStorage.getStore();
          const userId = store?.userId;

          if (userId && MODELS_WITH_AUDIT.includes(model)) {
            // 软删除：将 delete 转换为 update
            const delegateKey = MODEL_DELEGATE_KEYS[model];
            const delegate = (baseClient as any)[delegateKey];
            if (delegate) {
              return delegate.update({
                where: args.where,
                data: {
                  deletedAt: new Date(),
                  deletedBy: userId,
                },
              });
            }
          }
          return query(args);
        },
      },
    },
  });
}
