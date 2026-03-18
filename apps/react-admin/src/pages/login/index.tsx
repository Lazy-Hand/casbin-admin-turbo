import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Alert, App, Button, Card, Form, Input, Space, Typography } from 'antd'
import { bootstrapAuth, login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { LoginPayload } from '@/types/auth'

type LoginSearch = {
  redirect?: string
}

export function LoginPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' }) as LoginSearch
  const setLoginResult = useAuthStore((state) => state.setLoginResult)
  const setBootstrapData = useAuthStore((state) => state.setBootstrapData)

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const loginResult = await login(payload)
      setLoginResult(loginResult)
      const bootstrapData = await bootstrapAuth()

      return {
        loginResult,
        bootstrapData,
      }
    },
    onSuccess: async ({ bootstrapData }) => {
      setBootstrapData(bootstrapData)
      await message.success('登录成功')
      await navigate({ to: search.redirect || '/' })
    },
  })

  const handleSubmit = (values: LoginPayload) => {
    loginMutation.mutate(values)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden rounded-3xl border-border/80 shadow-xl shadow-slate-200/60">
          <Space direction="vertical" size={20} style={{ display: 'flex' }}>
            <div>
              <Typography.Title level={2} style={{ marginBottom: 8 }}>
                欢迎回来
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                当前登录、用户信息和路由权限都已经接到和 Vue 项目同一套后端接口。
              </Typography.Paragraph>
            </div>

            <Form<LoginPayload> layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
                登录
              </Button>
            </Form>

            {loginMutation.isError ? (
              <Alert
                type="error"
                showIcon
                message={loginMutation.error instanceof Error ? loginMutation.error.message : '登录失败'}
              />
            ) : null}
          </Space>
        </Card>
      </div>
    </div>
  )
}
