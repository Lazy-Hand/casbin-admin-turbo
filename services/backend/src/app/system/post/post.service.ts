import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        postName: true,
        postCode: true,
        sort: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        sort: 'asc',
      },
    });
  }

  async findPage(dto: SearchPostDto) {
    const { pageNo = 1, pageSize = 10, postName, postCode, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
    };

    if (postName) {
      where.postName = {
        contains: postName,
      };
    }

    if (postCode) {
      where.postCode = {
        contains: postCode,
      };
    }

    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          postName: true,
          postCode: true,
          sort: true,
          status: true,
          remark: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          sort: 'asc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        postName: true,
        postCode: true,
        sort: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(dto: CreatePostDto) {
    const existPost = await this.prisma.post.findFirst({
      where: {
        postCode: dto.postCode,
        deletedAt: null,
      },
    });

    if (existPost) {
      throw new BadRequestException('岗位编码已存在');
    }

    return this.prisma.post.create({
      data: {
        postName: dto.postName,
        postCode: dto.postCode,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
        remark: dto.remark,
      },
      select: {
        id: true,
        postName: true,
        postCode: true,
        sort: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: number, dto: UpdatePostDto) {
    if (dto.postCode) {
      const existPost = await this.prisma.post.findFirst({
        where: {
          postCode: dto.postCode,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existPost) {
        throw new BadRequestException('岗位编码已存在');
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        postName: dto.postName,
        postCode: dto.postCode,
        sort: dto.sort,
        status: dto.status,
        remark: dto.remark,
      },
      select: {
        id: true,
        postName: true,
        postCode: true,
        sort: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    const userCount = await this.prisma.user.count({
      where: { postId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException('该岗位下存在用户，无法删除');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        postName: true,
        postCode: true,
      },
    });
  }

  async getOptions() {
    return this.prisma.post.findMany({
      where: {
        status: 1,
        deletedAt: null,
      },
      select: {
        id: true,
        postName: true,
        postCode: true,
      },
      orderBy: {
        sort: 'asc',
      },
    });
  }
}
