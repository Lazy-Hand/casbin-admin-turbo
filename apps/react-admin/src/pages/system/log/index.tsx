import { Card, Tabs } from 'antd'
import { LoginLogTab } from '@/components/system/log/LoginLogTab'
import { OperationLogTab } from '@/components/system/log/OperationLogTab'

export function LogPage() {
  return (
    <Card>
      <Tabs
        items={[
          {
            key: 'operation',
            label: '操作日志',
            children: <OperationLogTab />,
          },
          {
            key: 'login',
            label: '登录日志',
            children: <LoginLogTab />,
          },
        ]}
      />
    </Card>
  )
}
