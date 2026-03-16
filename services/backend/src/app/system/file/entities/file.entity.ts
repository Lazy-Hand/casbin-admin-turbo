import { ApiProperty } from '@nestjs/swagger';
import { SysFile as SysFileModel } from '@prisma/client';
import { BaseEntity } from '@/common/entities/base.entity';

export class FileEntity extends BaseEntity implements SysFileModel {
  @ApiProperty({ description: '存储的文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: 'MIME 类型' })
  mimetype: string;

  @ApiProperty({ description: '存储路径' })
  path: string;

  @ApiProperty({ description: '文件扩展名' })
  extension: string;

  @ApiProperty({ description: '文件类型' })
  fileType: FileType;

  @ApiProperty({ description: '是否公开访问' })
  isPublic: boolean;

  @ApiProperty({ description: '状态：1-正常，0-禁用' })
  status: number;

  @ApiProperty({ description: '关联业务ID', required: false })
  businessId: number | null;

  @ApiProperty({ description: '关联业务类型', required: false })
  businessType: string | null;
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE',
  FILE = 'FILE',
}
