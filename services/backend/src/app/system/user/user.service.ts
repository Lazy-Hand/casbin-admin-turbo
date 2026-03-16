import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private dataScopeService: DataScopeService,
    private userRepository: UserRepository,
  ) {}

  // 获取所有用户（带角色信息和部门信息）
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        gender: true,
        avatar: true,
        email: true,
        mobile: true,
        status: true,
        deptId: true,
        postId: true,
        createdAt: true,
        updatedAt: true,
        dept: {
          select: {
            id: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            postName: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCode: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取用户详情
  async getUserDetail(userId: number, currentUserId?: number) {
    return this.userRepository.findOne(userId, currentUserId);
  }

  async create(dto: CreateUserDto) {
    const { roles, deptId, postId, ...userData } = dto;
    if (!userData.password) {
      throw new BadRequestException('密码不能为空');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 验证部门是否存在
    if (deptId) {
      const dept = await this.prisma.dept.findUnique({
        where: { id: deptId },
        select: { id: true },
      });
      if (!dept) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    // 验证岗位是否存在
    if (postId) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });
      if (!post) {
        throw new BadRequestException('指定的岗位不存在');
      }
    }

    // 使用 transaction 方法，有完整的类型提示
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建用户 - tx 有完整的类型提示
      const user = await tx.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          deptId,
          postId,
        },
      });

      // 如果有角色，创建用户角色关联
      if (roles && roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((roleId) => ({
            userId: user.id,
            roleId: roleId,
          })),
        });
      }

      return user;
    });

    return result;
  }

  // 更新用户
  async update(id: number, dto: UpdateUserDto) {
    const { roles, deptId, postId, ...userData } = dto;
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    // 验证部门是否存在
    if (deptId !== undefined) {
      const dept = await this.prisma.dept.findUnique({
        where: { id: deptId },
        select: { id: true },
      });
      if (!dept) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    // 验证岗位是否存在
    if (postId !== undefined) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });
      if (!post) {
        throw new BadRequestException('指定的岗位不存在');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 更新用户基本信息
      const user = await tx.user.update({
        where: { id },
        data: {
          ...userData,
          ...(hashedPassword ? { password: hashedPassword } : {}),
          deptId,
          postId,
          gender: userData.gender !== undefined ? +userData.gender : undefined,
          status: userData.status !== undefined ? +userData.status : undefined,
        },
      });

      // 如果传入了角色数组，更新角色关联
      if (roles !== undefined) {
        // 先删除旧的角色关联
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // 如果有新角色，创建新的关联
        if (roles.length > 0) {
          await tx.userRole.createMany({
            data: roles.map((roleId) => ({
              userId: id,
              roleId: roleId,
            })),
          });
        }
      }

      return user;
    });

    return result;
  }

  // 删除用户
  async delete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 先删除用户角色关联
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // 删除用户
      return tx.user.delete({
        where: { id },
      });
    });
  }

  // 分页查询用户
  async findPage(dto: SearchUserDto, currentUserId?: number) {
    return this.userRepository.findPage(currentUserId, dto);
  }
}
