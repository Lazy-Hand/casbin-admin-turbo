import { ApiProperty } from '@nestjs/swagger';
import type { MenuTypeValue } from '@/app/library/drizzle';

/**
 * 路由/菜单权限树节点（供前端路由渲染）
 */
export class RoutePermissionTreeNodeDto {
  @ApiProperty({ description: '权限ID' })
  id: number;

  @ApiProperty({ description: '权限名称' })
  permName: string;

  @ApiProperty({ description: '权限编码' })
  permCode: string;

  @ApiProperty({ description: '路由路径', required: false })
  path?: string;

  @ApiProperty({ description: '图标', required: false })
  icon?: string;

  @ApiProperty({ description: '菜单类型', enum: ['menu', 'page', 'link', 'iframe', 'window', 'divider', 'group'], required: false })
  menuType?: MenuTypeValue | null;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '是否缓存', required: false })
  cache?: number;

  @ApiProperty({ description: '是否隐藏', required: false })
  hidden?: number;

  @ApiProperty({
    description: '按钮权限编码列表',
    required: false,
    type: [String],
  })
  buttons?: string[];

  @ApiProperty({
    description: '子节点',
    type: [RoutePermissionTreeNodeDto],
    required: false,
  })
  children?: RoutePermissionTreeNodeDto[];
}
