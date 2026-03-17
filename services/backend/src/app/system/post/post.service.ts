import { Injectable, BadRequestException } from '@nestjs/common';
import { and, asc, eq, ilike, ne, sql } from 'drizzle-orm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import {
  DrizzleService,
  Post,
  User,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '../../library/drizzle';

@Injectable()
export class PostService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll() {
    return this.drizzle.db
      .select({
        id: Post.id,
        postName: Post.postName,
        postCode: Post.postCode,
        sort: Post.sort,
        status: Post.status,
        remark: Post.remark,
        createdAt: Post.createdAt,
        updatedAt: Post.updatedAt,
      })
      .from(Post)
      .where(withSoftDelete(Post))
      .orderBy(asc(Post.sort));
  }

  async findPage(dto: SearchPostDto) {
    const { pageNo = 1, pageSize = 10, postName, postCode, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const where = and(
      withSoftDelete(Post),
      postName ? ilike(Post.postName, `%${postName}%`) : undefined,
      postCode ? ilike(Post.postCode, `%${postCode}%`) : undefined,
      status !== undefined ? eq(Post.status, status) : undefined,
    );

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select({
          id: Post.id,
          postName: Post.postName,
          postCode: Post.postCode,
          sort: Post.sort,
          status: Post.status,
          remark: Post.remark,
          createdAt: Post.createdAt,
          updatedAt: Post.updatedAt,
        })
        .from(Post)
        .where(where)
        .orderBy(asc(Post.sort))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({ total: sql<number>`count(*)` })
        .from(Post)
        .where(where),
    ]);

    return {
      list,
      total: total[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }

  async findOne(id: number) {
    return this.drizzle.findFirst(Post, eq(Post.id, id));
  }

  async create(dto: CreatePostDto) {
    const existPost = await this.drizzle.findFirst(Post, eq(Post.postCode, dto.postCode));

    if (existPost) {
      throw new BadRequestException('岗位编码已存在');
    }

    const createdPosts = await insertWithAudit(this.drizzle.db, Post, {
        postName: dto.postName,
        postCode: dto.postCode,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
        remark: dto.remark ?? null,
        updatedAt: new Date().toISOString(),
    });
    const created = Array.isArray(createdPosts) ? createdPosts[0] ?? null : createdPosts;
    return created;
  }

  async update(id: number, dto: UpdatePostDto) {
    if (dto.postCode) {
      const rows = await this.drizzle.db
        .select({ id: Post.id })
        .from(Post)
        .where(
          and(
            withSoftDelete(Post),
            eq(Post.postCode, dto.postCode),
            ne(Post.id, id),
          ),
        )
        .limit(1);
      const existPost = rows[0];

      if (existPost) {
        throw new BadRequestException('岗位编码已存在');
      }
    }

    const updatedPosts = await updateWithAudit(this.drizzle.db, Post, eq(Post.id, id), {
        postName: dto.postName,
        postCode: dto.postCode,
        sort: dto.sort,
        status: dto.status,
        remark: dto.remark,
    });
    return Array.isArray(updatedPosts) ? updatedPosts[0] ?? null : updatedPosts;
  }

  async remove(id: number) {
    const userCount = await this.drizzle.db
      .select({ total: sql<number>`count(*)` })
      .from(User)
      .where(and(withSoftDelete(User), eq(User.postId, id)));

    if ((userCount[0]?.total ?? 0) > 0) {
      throw new BadRequestException('该岗位下存在用户，无法删除');
    }

    const deletedPosts = await softDeleteWhere(this.drizzle.db, Post, eq(Post.id, id));
    const deleted = Array.isArray(deletedPosts) ? deletedPosts[0] ?? null : deletedPosts;

    if (!deleted) {
      return null;
    }

    return {
      id: deleted.id,
      postName: deleted.postName,
      postCode: deleted.postCode,
    };
  }

  async getOptions() {
    return this.drizzle.db
      .select({
        id: Post.id,
        postName: Post.postName,
        postCode: Post.postCode,
      })
      .from(Post)
      .where(and(withSoftDelete(Post), eq(Post.status, 1)))
      .orderBy(asc(Post.sort));
  }
}
