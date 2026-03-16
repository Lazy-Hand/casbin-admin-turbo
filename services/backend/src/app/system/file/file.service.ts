import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateFileDto, UpdateFileDto } from './dto/file.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { FileType } from './entities/file.entity';
import {
  existsSync,
  unlinkSync,
  createWriteStream,
  createReadStream,
  readdirSync,
  rmSync,
} from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { pipeline } from 'stream/promises';
import { Prisma, SysFile } from '@prisma/client';

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  extension: string;
  url: string;
}

@Injectable()
export class FileService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // 获取上传目录
  getUploadDir(): string {
    return join(
      process.cwd(),
      this.configService.get('upload.dir') || 'uploads',
    );
  }

  // 获取分片临时目录
  getChunkDir(): string {
    return join(
      process.cwd(),
      this.configService.get('upload.chunkDir') || 'uploads/chunks',
    );
  }

  private resolveChunkDir(uploadId: string): string {
    if (!/^[A-Za-z0-9_-]+$/.test(uploadId)) {
      throw new BadRequestException('非法的上传标识');
    }

    return join(this.getChunkDir(), uploadId);
  }

  // 获取访问前缀
  getUploadPrefix(): string {
    return this.configService.get('upload.prefix') || '/uploads';
  }

  // 获取完整的文件访问URL
  getFileUrl(filename: string): string {
    const serverUrl: string =
      this.configService.get('server.url') || 'http://localhost:8080';
    const prefix = this.getUploadPrefix();
    return `${serverUrl}${prefix}/${filename}`;
  }

  // 处理上传的文件
  async processUploadedFile(
    file: Express.Multer.File,
    filename?: string,
    businessId?: number,
    businessType?: string,
  ): Promise<SysFile & { url: string }> {
    const decodedOriginalName = this.decodeOriginalName(file.originalname);
    const finalFilename =
      filename ||
      `${Date.now()}-${Math.random().toString(36).substring(7)}${extname(decodedOriginalName).toLowerCase()}`;
    const extension = extname(decodedOriginalName).toLowerCase();
    const path = join(this.getUploadDir(), finalFilename);
    // 返回完整的文件访问URL
    const url = this.getFileUrl(finalFilename);

    const fileRecord = await this.create({
      filename: finalFilename,
      originalName: decodedOriginalName,
      size: file.size,
      mimetype: file.mimetype,
      path: path,
      extension,
      businessId,
      businessType,
    });

    // 返回文件信息和数据库记录的完整对象
    return {
      ...fileRecord,
      url,
    };
  }

  /**
   * 保存分片到临时目录（支持 memoryStorage 和 diskStorage）
   */
  async saveChunk(
    file: Express.Multer.File,
    uploadId: string,
    chunkIndex: number,
  ): Promise<{ saved: boolean }> {
    const chunkDir = this.resolveChunkDir(uploadId);
    if (!existsSync(chunkDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(chunkDir, { recursive: true });
    }
    const chunkPath = join(chunkDir, `chunk-${chunkIndex}`);
    if (file.buffer) {
      const { writeFile } = await import('fs/promises');
      await writeFile(chunkPath, file.buffer);
    } else if (file.path) {
      await pipeline(createReadStream(file.path), createWriteStream(chunkPath));
    } else {
      throw new BadRequestException('无效的分片数据');
    }
    return { saved: true };
  }

  /**
   * 合并分片并创建文件记录
   */
  async mergeChunks(
    uploadId: string,
    totalChunks: number,
    filename: string,
    mimetype: string,
    totalSize: number,
    businessId?: number,
    businessType?: string,
  ): Promise<SysFile & { url: string }> {
    const chunkDir = this.resolveChunkDir(uploadId);
    if (!existsSync(chunkDir)) {
      throw new BadRequestException('分片不存在或已过期，请重新上传');
    }

    const decodedOriginalName = this.decodeOriginalName(filename);
    const extension = extname(decodedOriginalName).toLowerCase();

    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const finalFilename = `${datePath}/${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;

    const targetDir = join(this.getUploadDir(), datePath);
    const outputPath = join(this.getUploadDir(), finalFilename);

    if (!existsSync(targetDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(targetDir, { recursive: true });
    }

    const writeStream = createWriteStream(outputPath, { flags: 'a' });

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunkDir, `chunk-${i}`);
        if (!existsSync(chunkPath)) {
          throw new BadRequestException(`分片 ${i} 缺失，请重新上传`);
        }
        const readStream = createReadStream(chunkPath);
        const isLastChunk = i === totalChunks - 1;
        await pipeline(readStream, writeStream, { end: isLastChunk });
      }
    } finally {
      if (!writeStream.writableEnded) {
        writeStream.end();
      }
    }

    // 删除临时分片目录
    rmSync(chunkDir, { recursive: true, force: true });

    const url = this.getFileUrl(finalFilename);

    const fileRecord = await this.create({
      filename: finalFilename,
      originalName: decodedOriginalName,
      size: totalSize,
      mimetype,
      path: this.getUploadDir(),
      extension,
      businessId,
      businessType,
    });

    return {
      ...fileRecord,
      url,
    };
  }

  /**
   * 校验分片是否已存在（用于断点续传）
   */
  checkChunkExists(uploadId: string, chunkIndex: number) {
    const chunkPath = join(this.resolveChunkDir(uploadId), `chunk-${chunkIndex}`);
    return existsSync(chunkPath);
  }

  // 根据业务类型查询文件
  async findByBusiness(businessType: string, businessId: number) {
    return this.prisma.sysFile.findMany({
      where: {
        businessType,
        businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取所有文件
  async findAll() {
    return this.prisma.sysFile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取文件详情
  async findOne(id: number) {
    return this.prisma.sysFile.findUnique({
      where: { id },
    });
  }

  // 根据文件名获取文件
  async findByFilename(filename: string) {
    return this.prisma.sysFile.findUnique({
      where: { filename },
    });
  }

  // 创建文件记录
  async create(dto: CreateFileDto) {
    // 根据文件扩展名确定文件类型
    const fileType =
      dto.fileType || this.getFileType(dto.extension, dto.mimetype);

    return this.prisma.sysFile.create({
      data: {
        ...dto,
        fileType,
      },
    });
  }

  // 更新文件记录
  async update(id: number, dto: UpdateFileDto) {
    return this.prisma.sysFile.update({
      where: { id },
      data: dto,
    });
  }

  // 删除文件记录
  async delete(id: number) {
    return this.prisma.sysFile.delete({
      where: { id },
    });
  }

  // 分页查询文件
  async findPage(
    dto: PaginationDto & { fileType?: FileType; isPublic?: boolean },
  ) {
    const { pageNo = 1, pageSize = 10, fileType, isPublic } = dto;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.SysFileWhereInput = {};
    if (fileType) {
      where.fileType = fileType;
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const [list, total] = await Promise.all([
      this.prisma.sysFile.findMany({
        skip,
        take,
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.sysFile.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }

  // 修复 multer 中文文件名乱码问题
  private decodeOriginalName(name: string): string {
    if (!name) return name;
    try {
      // 检查是否包含高于255的字符（也就是正常的UTF-8非拉丁字符，如中文字符）
      const hasHighByte = Array.from(name).some(
        (char) => char.charCodeAt(0) > 255,
      );
      // 如果没有高于255的字符，说明可能被当成 latin1 解析了（multer 默认行为）
      if (!hasHighByte) {
        const decoded = Buffer.from(name, 'latin1').toString('utf8');
        // 如果转换后没有乱码占用符()，说明转换成功
        if (!decoded.includes('\uFFFD')) {
          return decoded;
        }
      }
    } catch (e) {
      // ignore
    }
    return name;
  }

  // 根据扩展名和 MIME 类型判断文件类型
  private getFileType(extension: string, mimetype: string): FileType {
    const ext = extension.toLowerCase();
    const mime = mimetype.toLowerCase();

    // 图片
    if (
      mime.startsWith('image/') ||
      [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.svg',
        '.ico',
      ].includes(ext)
    ) {
      return FileType.IMAGE;
    }

    // 视频
    if (
      mime.startsWith('video/') ||
      ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)
    ) {
      return FileType.VIDEO;
    }

    // 音频
    if (
      mime.startsWith('audio/') ||
      ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma', '.m4a'].includes(ext)
    ) {
      return FileType.AUDIO;
    }

    // 文档
    if (
      [
        '.doc',
        '.docx',
        '.pdf',
        '.txt',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.odt',
        '.ods',
      ].includes(ext)
    ) {
      return FileType.DOCUMENT;
    }

    // 压缩包
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return FileType.ARCHIVE;
    }

    return FileType.FILE;
  }
}
