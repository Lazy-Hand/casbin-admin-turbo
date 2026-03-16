import http from '@/utils/request'

/**
 * @description: 用户信息接口定义
 */
export interface UserInfo {
  id: string
  username: string
  avatar: string
  role: string[]
}

/**
 * @description: 登录返回类型
 */
export interface LoginResult {
  token: string
  expires: number
}

/**
 * @description: 获取用户信息
 * @param {string} id 用户ID
 */
export const getUserInfo = (id: string) => {
  // 泛型指定返回 data 的类型
  return http.get<UserInfo>(`/user/${id}`)
}

/**
 * @description: 用户登录
 * 演示：自定义配置（开启重试）
 */
export const login = (params: object) => {
  return http.post<LoginResult>('/auth/login', params, {
    // 覆盖默认配置，开启重试机制
    enableRetry: true,
    retryCount: 2,
  })
}

/**
 * @description: 获取大列表
 * 演示：取消请求 (AbortController)
 */
export const getLargeList = (controller: AbortController) => {
  return http.get(
    '/list/large',
    {},
    {
      // 绑定信号
      signal: controller.signal,
      // 长超时时间
      timeout: 60000,
    },
  )
}

/**
 * @description: 错误演示
 * 演示：跳过默认错误处理，业务层自己 catch
 */
export const getErrorApi = () => {
  return http.get(
    '/error/test',
    {},
    {
      isSkipErrorHandler: true,
    },
  )
}

/* ================= 使用示例 (伪代码) =================

// 1. 基础调用
const { data } = await getUserInfo('123');
console.log(data.username);

// 2. 取消请求
const controller = new AbortController();
getLargeList(controller).then(...).catch(err => {
  if (err.code === 'ERR_CANCELED') {
    console.log('请求已取消');
  }
});
// 取消
controller.abort();

// 3. 错误自行处理
try {
  await getErrorApi();
} catch (error) {
  // 自定义错误提示
  alert('发生了错误，但我自己处理了');
}

=================================================== */
