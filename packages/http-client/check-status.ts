export function checkStatus(
  status: number,
  msg: string,
  onUnauthorized?: () => void,
  onErrorAlert?: (msg: string) => void,
): void {
  let errorMessage = '';

  switch (status) {
    case 400:
      errorMessage = msg || '请求参数错误';
      break;
    case 401:
      errorMessage = msg || '登录已过期，请重新登录';
      onUnauthorized?.();
      break;
    case 403:
      errorMessage = '当前账号无权限访问该资源';
      break;
    case 404:
      errorMessage = '请求地址出错，未找到该资源';
      break;
    case 405:
      errorMessage = '请求方法未允许';
      break;
    case 408:
      errorMessage = '请求超时';
      break;
    case 500:
      errorMessage = '服务器内部错误，请联系管理员';
      break;
    case 501:
      errorMessage = '服务未实现';
      break;
    case 502:
      errorMessage = '网关错误';
      break;
    case 503:
      errorMessage = '服务不可用';
      break;
    case 504:
      errorMessage = '网关超时';
      break;
    case 505:
      errorMessage = 'HTTP版本不受支持';
      break;
    default:
      errorMessage = msg || `请求失败，状态码：${status}`;
  }

  if (typeof window !== 'undefined') {
    console.error(`[Axios Error]: ${errorMessage}`);
    onErrorAlert?.(errorMessage);
  }
}
