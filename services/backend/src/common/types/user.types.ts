/**
 * JWT Token 中的用户信息
 */
export interface JwtPayload {
  sub: number; // 用户ID
  username: string;
  iat?: number; // 签发时间
  exp?: number; // 过期时间
}

/**
 * Request 中的用户信息
 * 由 JWT Strategy 验证后注入
 */
export interface RequestUser {
  id: number;
  username: string;
}
