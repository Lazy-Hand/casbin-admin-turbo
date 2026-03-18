import { Card, Space, Tag, Typography } from "antd"

type PagePlaceholderProps = {
  title: string
  routePath: string
  description?: string
}

export function PagePlaceholder({ title, routePath, description = "页面骨架已创建，可以开始接真实列表、表单和权限按钮。" }: PagePlaceholderProps) {
  return (
    <Card>
      <Space orientation="vertical" size={16} style={{ display: "flex" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 8 }}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {description}
          </Typography.Paragraph>
        </div>
        <div className="flex items-center gap-3">
          <Tag color="blue">React Admin</Tag>
          <Tag>{routePath}</Tag>
        </div>
      </Space>
    </Card>
  )
}
