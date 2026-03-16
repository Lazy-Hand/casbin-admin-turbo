import { AsyncLocalStorage } from 'async_hooks';

/** 用于存储请求上下文中的用户信息，供数据库审计辅助逻辑使用 */
export const asyncLocalStorage = new AsyncLocalStorage<{ userId: number }>();
