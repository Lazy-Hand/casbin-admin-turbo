import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BaseEntity } from '@/common/entities/base.entity';

export class RoleEntity extends BaseEntity implements Role {
  @ApiProperty({ description: '角色编码' })
  roleCode: string;
  @ApiProperty({ description: '角色名称' })
  roleName: string;
  @ApiProperty({ description: '角色描述' })
  description: string;
  @ApiProperty({ description: '状态： 1-正常， 0-停用' })
  status: number;
  @ApiProperty({ description: '数据范围' })
  dataScope: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD';
  @ApiProperty({ description: '自定义部门ID列表' })
  customDepts: number[];
}
