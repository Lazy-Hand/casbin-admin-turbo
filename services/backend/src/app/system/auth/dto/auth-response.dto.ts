import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT 访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'JWT 过期时间',
    example: '2026-03-14T10:00:00.000Z',
  })
  expireAt: string;

  @ApiProperty({
    description: '登录时间',
    example: '2026-03-14T08:00:00.000Z',
  })
  loginTime: string;
}

export class UserProfileDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'john_doe' })
  username: string;

  @ApiProperty({ description: 'JWT 签发时间', example: 1234567890 })
  iat: number;

  @ApiProperty({ description: 'JWT 过期时间', example: 1234567890 })
  exp: number;
}
