import { LogoutOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd'
import { useRouterState } from '@tanstack/react-router'
import { AppTabs } from '@/layout/AppTabs'
import { buildAppMenus } from '@/config/menu'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useTabsStore } from '@/stores/tabs'
import '@/layout/AppLayout.css'

const { Header, Content, Sider } = Layout

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const appName = useAppStore((state) => state.appName)
  const buildLabel = useAppStore((state) => state.buildLabel)
  const user = useAuthStore((state) => state.user)
  const menuTree = useAuthStore((state) => state.menuTree)
  const clearSession = useAuthStore((state) => state.clearSession)
  const resetTabs = useTabsStore((state) => state.resetTabs)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={240} style={{ borderInlineEnd: '1px solid #f0f0f0' }}>
        <div style={{ padding: 24 }}>
          <Space direction="vertical" size={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {appName}
            </Typography.Title>
            <Tag color="blue">{buildLabel}</Tag>
          </Space>
        </div>
        <Menu className="app-side-menu" mode="inline" selectedKeys={[pathname]} items={buildAppMenus(menuTree)} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            paddingInline: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography.Text type="secondary">
            React + Vite + Ant Design + TanStack Router + Zustand
          </Typography.Text>
          <Space size={12}>
            <Typography.Text>{user?.username || '未登录'}</Typography.Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => {
                resetTabs()
                clearSession()
                window.location.replace('/login')
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <AppTabs />
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  )
}
