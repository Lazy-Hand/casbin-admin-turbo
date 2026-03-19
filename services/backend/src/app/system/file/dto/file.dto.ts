import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FileType } from '../entities/file.entity';

export class UploadFileDto {
  @IsOptional()
  @ApiProperty({ description: '上传文件', required: false })
  file?: Express.Multer.File;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '关联业务ID', required: false })
  businessId?: number;

  @IsOptional()
  @ApiProperty({ description: '关联业务类型', required: false })
  businessType?: string;
}

/** 分片上传：单个分片 */
export class UploadChunkDto {
  @IsString()
  @ApiProperty({ description: '上传唯一标识（同一文件的各分片需一致）' })
  uploadId: string;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '当前分片索引（从 0 开始）' })
  chunkIndex: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '总分片数' })
  totalChunks: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '关联业务ID', required: false })
  businessId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '关联业务类型', required: false })
  businessType?: string;
}

/** 分片上传：合并分片 */
export class MergeChunksDto {
  @IsString()
  @ApiProperty({ description: '上传唯一标识（需与上传分片时一致）' })
  uploadId: string;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '总分片数' })
  totalChunks: number;

  @IsString()
  @ApiProperty({ description: '原始文件名' })
  filename: string;

  @IsString()
  @ApiProperty({ description: 'MIME 类型' })
  mimetype: string;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '完整文件大小（字节）' })
  totalSize: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: '关联业务ID', required: false })
  businessId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '关联业务类型', required: false })
  businessType?: string;
}

export class CreateFileDto {
  @IsString()
  @ApiProperty({ description: '存储的文件名' })
  filename: string;

  @IsString()
  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @IsNumber()
  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @IsString()
  @ApiProperty({ description: 'MIME 类型' })
  mimetype: string;

  @IsString()
  @ApiProperty({ description: '存储路径' })
  path: string;

  @IsString()
  @ApiProperty({ description: '文件扩展名' })
  extension: string;

  @IsOptional()
  @IsEnum(FileType)
  @ApiProperty({ description: '文件类型', enum: FileType, required: false })
  fileType?: FileType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '是否公开访问', required: false })
  isPublic?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '关联业务ID', required: false })
  businessId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '关联业务类型', required: false })
  businessType?: string;
}

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '存储的文件名', required: false })
  filename?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '原始文件名', required: false })
  originalName?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '文件大小（字节）', required: false })
  size?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'MIME 类型', required: false })
  mimetype?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '存储路径', required: false })
  path?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '文件扩展名', required: false })
  extension?: string;

  @IsOptional()
  @IsEnum(FileType)
  @ApiProperty({ description: '文件类型', enum: FileType, required: false })
  fileType?: FileType;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '是否公开访问', required: false })
  isPublic?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '状态：1-正常，0-禁用', required: false })
  status?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '关联业务ID', required: false })
  businessId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '关联业务类型', required: false })
  businessType?: string;
}
