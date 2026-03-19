import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateFileDto,
  UpdateFileDto,
  UploadFileDto,
  UploadChunkDto,
  MergeChunksDto,
} from './dto/file.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { FileEntity } from './entities/file.entity';
import { PaginationDto, createPaginationResponse } from '@/common/dto/pagination.dto';
import { FileType } from './entities/file.entity';
import { Can } from '@/app/library/casl';
import { diskStorage, memoryStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { extname } from 'path';
import configuration from '@/config/configuration';

const uploadConfig = configuration().upload;

interface MulterRequest extends Request {
  uploadDatePath?: string;
}

const customStorage = diskStorage({
  destination: (req: MulterRequest, file, cb) => {
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    req.uploadDatePath = req.uploadDatePath || datePath;
    const dir = join(process.cwd(), uploadConfig.dir, req.uploadDatePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, join(process.cwd(), uploadConfig.dir));
  },
  filename: (req: MulterRequest, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const filename = `${req.uploadDatePath}/${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, filename);
  },
});

@ApiTags('文件管理')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // 上传目录
  private readonly uploadDir = uploadConfig.dir;
  // 最大文件大小
  private readonly maxFileSize = uploadConfig.maxFileSize;

  // 确保上传目录存在
  ensureUploadDir() {
    const dir = join(process.cwd(), this.uploadDir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  @Post('upload')
  @Can('create', 'File')
  @ApiOperation({ summary: '单文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        businessId: { type: 'number' },
        businessType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: customStorage,
      limits: {
        fileSize: uploadConfig.maxFileSize,
      },
    }),
  )
  @ApiSuccessResponse(FileEntity, {
    description: '成功上传文件，返回完整的文件记录信息',
  })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
  ): Promise<FileEntity> {
    if (!file) throw new BadRequestException('请选择要上传的文件');
    const result = await this.fileService.processUploadedFile(
      file,
      file.filename,
      uploadDto.businessId,
      uploadDto.businessType,
    );
    return result as unknown as FileEntity;
  }

  @Post('upload/multiple')
  @Can('create', 'File')
  @ApiOperation({ summary: '多文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        businessId: { type: 'number' },
        businessType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', uploadConfig.maxFiles, {
      storage: customStorage,
      limits: {
        fileSize: uploadConfig.maxFileSize,
      },
    }),
  )
  @ApiSuccessResponse(FileEntity, {
    description: '成功上传多个文件，返回完整的文件记录数组',
    isArray: true,
  })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadFileDto,
  ): Promise<FileEntity[]> {
    if (!files?.length) throw new BadRequestException('请选择要上传的文件');
    const results: FileEntity[] = [];
    for (const file of files) {
      const result = await this.fileService.processUploadedFile(
        file,
        file.filename,
        uploadDto.businessId,
        uploadDto.businessType,
      );
      results.push(result as unknown as FileEntity);
    }
    return results;
  }

  @Post('upload/chunk')
  @Can('create', 'File')
  @ApiOperation({ summary: '分片上传：上传单个分片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadId: { type: 'string' },
        chunkIndex: { type: 'number' },
        totalChunks: { type: 'number' },
        businessId: { type: 'number' },
        businessType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: uploadConfig.chunkSize,
      },
    }),
  )
  @ApiSuccessResponse(Object, {
    description: '分片上传成功',
  })
  async uploadChunk(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadChunkDto) {
    if (!file) throw new BadRequestException('请选择要上传的分片');
    await this.fileService.saveChunk(file, dto.uploadId, dto.chunkIndex);
    return { uploadId: dto.uploadId, chunkIndex: dto.chunkIndex };
  }

  @Post('upload/chunk/merge')
  @Can('create', 'File')
  @ApiOperation({ summary: '分片上传：合并分片' })
  @ApiSuccessResponse(FileEntity, {
    description: '合并成功，返回完整的文件记录信息',
  })
  async mergeChunks(@Body() dto: MergeChunksDto): Promise<FileEntity> {
    const result = await this.fileService.mergeChunks(
      dto.uploadId,
      dto.totalChunks,
      dto.filename,
      dto.mimetype,
      dto.totalSize,
      dto.businessId,
      dto.businessType,
    );
    return result as unknown as FileEntity;
  }

  @Get('business/:businessType/:businessId')
  @Can('read', 'File')
  @ApiOperation({ summary: '根据业务类型和ID查询文件列表' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功返回文件列表',
    isArray: true,
  })
  async findByBusiness(
    @Param('businessType') businessType: string,
    @Param('businessId') businessId: string,
  ) {
    return this.fileService.findByBusiness(businessType, parseInt(businessId));
  }

  @Get('page')
  @Can('read', 'File')
  @ApiOperation({ summary: '分页查询文件列表' })
  @ApiPaginatedResponse(FileEntity, {
    description: '成功返回文件列表',
  })
  async findPage(
    @Query() paginationDto: PaginationDto,
    @Query('fileType') fileType?: FileType,
    @Query('isPublic') isPublic?: string,
  ) {
    const { list, total, pageNo, pageSize } = await this.fileService.findPage({
      ...paginationDto,
      fileType,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
    });
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get()
  @Can('read', 'File')
  @ApiOperation({ summary: '获取所有文件（不分页）' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功返回所有文件',
    isArray: true,
  })
  async findAll() {
    return this.fileService.findAll();
  }

  @Get(':id')
  @Can('read', 'File')
  @ApiOperation({ summary: '获取文件详情' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功返回文件详情',
  })
  async findOne(@Param('id') id: string) {
    return this.fileService.findOne(+id);
  }

  @Post()
  @Can('create', 'File')
  @ApiOperation({ summary: '创建文件记录' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功创建文件记录',
  })
  async create(@Body() dto: CreateFileDto) {
    return this.fileService.create(dto);
  }

  @Patch(':id')
  @Can('update', 'File')
  @ApiOperation({ summary: '更新文件记录' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功更新文件记录',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.fileService.update(+id, dto);
  }

  @Delete(':id')
  @Can('delete', 'File')
  @ApiOperation({ summary: '删除文件记录' })
  @ApiSuccessResponse(FileEntity, {
    description: '成功删除文件记录',
  })
  async delete(@Param('id') id: string) {
    return this.fileService.delete(+id);
  }
}
