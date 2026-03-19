import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService, User } from './app/library/drizzle';

@Injectable()
export class AppService {
  constructor(private readonly drizzle: DrizzleService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // 示例：获取所有用户
  async getUsers() {
    return this.drizzle.findMany(User);
  }

  // 示例：根据 ID 获取用户
  async getUserById(id: number) {
    return this.drizzle.findFirst(User, eq(User.id, id));
  }

  // 示例：创建用户
  async createUser(username: string, password: string) {
    const rows = await this.drizzle.insertWithAudit(User, {
      username,
      password,
      nickname: '',
      email: '',
      mobile: '',
      gender: 0,
      avatar: '',
      status: 1,
      isAdmin: false,
      updatedAt: new Date().toISOString(),
    });

    return Array.isArray(rows) ? (rows[0] ?? null) : null;
  }
}
