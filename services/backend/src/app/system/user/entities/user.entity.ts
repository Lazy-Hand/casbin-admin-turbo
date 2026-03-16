import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { BaseEntity } from '@/common/entities/base.entity';
export class UserEntity extends BaseEntity implements User {
  @ApiProperty({ description: '用户名' })
  username: string;
  @ApiProperty({ description: '登录密码' })
  password: string;
  @ApiProperty({ description: '用户昵称' })
  nickname: string;
  @ApiProperty({ description: '性别：0-未知，1-男，2-女' })
  gender: number;
  @ApiProperty({ description: '头像' })
  avatar: string;
  @ApiProperty({ description: '邮箱' })
  email: string;
  @ApiProperty({ description: '手机号' })
  mobile: string;
  @ApiProperty({ description: '状态： 1-正常， 0-停用' })
  status: number;
  @ApiProperty({ description: '是否管理员' })
  isAdmin: boolean;
  @ApiProperty({ description: '部门ID' })
  deptId: number | null;
  @ApiProperty({ description: '岗位ID' })
  postId: number | null;
}
