import { Card, Col, Row, Space, Statistic, Typography } from 'antd'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const appName = useAppStore((state) => state.appName)

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <div className="rounded-3xl border border-border/80 bg-card/90 p-8 shadow-sm backdrop-blur-sm">
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          {appName}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          这是一个基础项目骨架，已经接好路由、状态管理和 Ant Design 布局。
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          当前登录、用户信息和路由权限已经接入真实接口；首页统计卡片先保留为固定骨架，后面直接替换成真实
          dashboard 接口即可。
        </Typography.Paragraph>
        <div className="mt-6 flex items-center gap-3">
          <Button asChild>
            <a href="/playground">
              打开 Playground
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button variant="outline">shadcn Button 已接入</Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="UI Framework" value="Ant Design" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Router" value="TanStack Router" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="State" value="Zustand" />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
