import { Card, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { PermissionGate } from '@/components/PermissionGate'
import { IconSelect } from '@/components/icon/IconSelect'
import { useAppStore } from '@/stores/app'
import { usePermission } from '@/hooks/usePermission'
import { Button } from '@/components/ui/button'

export function PlaygroundPage() {
  const [iconValue, setIconValue] = useState<string>()
  const appName = useAppStore((state) => state.appName)
  const setAppName = useAppStore((state) => state.setAppName)
  const reset = useAppStore((state) => state.reset)
  const { buttonPermissions } = usePermission()

  return (
    <Card title="Playground">
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          这里放一个最小 Zustand 例子，方便后续直接往真实业务里扩。
        </Typography.Paragraph>
        <Input value={appName} onChange={(event) => setAppName(event.target.value)} />
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <Typography.Text type="secondary">
            这里的按钮已经换成 shadcn 风格组件，说明 Tailwind 与组件工具链已经生效。
          </Typography.Text>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            当前按钮权限
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {buttonPermissions.length ? buttonPermissions.join('、') : '当前账号还没有返回按钮级权限'}
          </Typography.Paragraph>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Icon Select
          </Typography.Title>
          <Space direction="vertical" size={12} style={{ display: 'flex' }}>
            <IconSelect value={iconValue} onChange={setIconValue} />
            <Typography.Text type="secondary">
              当前值：{iconValue || '未选择'}
            </Typography.Text>
          </Space>
        </div>
        <Space>
          <Button onClick={() => setAppName('Casbin React Admin')}>使用默认名称</Button>
          <Button variant="outline" onClick={reset}>
            重置状态
          </Button>
          <Button variant="secondary">当前状态通过 Zustand 驱动</Button>
        </Space>
        <Space>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="示例图标按钮">
            Z
          </Button>
        </Space>
        <Space wrap>
          <PermissionGate
            permCode="system:user:create"
            fallback={<Button variant="outline" disabled>缺少 system:user:create</Button>}
          >
            <Button>新建用户</Button>
          </PermissionGate>
          <PermissionGate
            permCode="system:role:update"
            fallback={<Button variant="outline" disabled>缺少 system:role:update</Button>}
          >
            <Button variant="secondary">编辑角色</Button>
          </PermissionGate>
          <PermissionGate
            permCode="system:permission:delete"
            fallback={<Button variant="outline" disabled>缺少 system:permission:delete</Button>}
          >
            <Button variant="destructive">删除权限</Button>
          </PermissionGate>
        </Space>
      </Space>
    </Card>
  )
}
