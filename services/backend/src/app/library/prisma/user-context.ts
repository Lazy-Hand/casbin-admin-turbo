import { AsyncLocalStorage } from 'async_hooks';

/** 用于存储请求上下文中的用户信息，供 Prisma 审计扩展使用 */
export const asyncLocalStorage = new AsyncLocalStorage<{ userId: number }>();
