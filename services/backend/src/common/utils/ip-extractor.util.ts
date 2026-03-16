/**
 * 从请求中提取客户端 IP 地址
 * 优先级：X-Forwarded-For 首位 > X-Real-IP > req.ip > remoteAddress
 * @param request 请求对象
 * @returns IP 地址
 */
export function extractIp(request: any): string {
  // 1. 尝试从 X-Forwarded-For 获取（代理环境）
  const xForwardedFor = request.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For 可能包含多个 IP，取第一个
    return xForwardedFor.split(',')[0].trim();
  }

  // 2. 尝试从 X-Real-IP 获取
  const xRealIp = request.headers?.['x-real-ip'];
  if (xRealIp) {
    return xRealIp;
  }

  // 3. 使用 req.ip
  if (request.ip) {
    return request.ip;
  }

  // 4. 使用 socket.remoteAddress
  if (request.socket?.remoteAddress) {
    return request.socket.remoteAddress;
  }

  return '';
}

/**
 * 从请求中提取 User Agent
 * @param request 请求对象
 * @returns User Agent 字符串
 */
export function extractUserAgent(request: any): string {
  return request.headers?.['user-agent'] || '';
}
