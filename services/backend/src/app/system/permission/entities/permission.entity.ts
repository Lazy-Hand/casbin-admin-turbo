import { ApiProperty } from '@nestjs/swagger';
import { MenuType, Permission, ResourceType } from '@prisma/client';
import { BaseEntity } from '@/common/entities/base.entity';

export class PermissionEntity extends BaseEntity implements Permission {
  @ApiProperty({ description: '权限编码' })
  permCode: string;
  @ApiProperty({ description: '权限名称' })
  permName: string;
  @ApiProperty({ description: '权限url' })
  path: string;
  @ApiProperty({ description: '权限类型-menu:菜单、api:接口、button:按钮' })
  resourceType: ResourceType;
  @ApiProperty({ description: '菜单类型' })
  menuType: MenuType;
  @ApiProperty({ description: '页面是否缓存' })
  cache: number;
  @ApiProperty({ description: '接口方法' })
  method: string;
  @ApiProperty({ description: '菜单图标' })
  icon: string;
  @ApiProperty({ description: '排序' })
  sort: number;
  @ApiProperty({ description: '菜单是否隐藏' })
  hidden: number;
  @ApiProperty({ description: '数据状态' })
  status: number;
  @ApiProperty({ description: '父级菜单' })
  parentId: number | null;
  @ApiProperty({ description: '组件路径' })
  component: string;

  @ApiProperty({ description: '内链URL' })
  frameUrl: string;
}
