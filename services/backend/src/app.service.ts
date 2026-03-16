import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // 示例：获取所有用户
  async getUsers() {
    return this.prisma.user.findMany();
  }

  // 示例：根据 ID 获取用户
  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // 示例：创建用户
  async createUser(username: string, password: string) {
    return this.prisma.user.create({
      data: {
        username,
        password,
      },
    });
  }
}
