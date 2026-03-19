import { useState } from 'react'
import { App, Button, Card, Col, Row, Space, Typography } from 'antd'
import { FileUpload, ImageUpload } from '@/components/upload'
import type { FileEntity } from '@/api/file'

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export function WorkbenchPage() {
  const { message } = App.useApp()
  const [testImage, setTestImage] = useState<FileEntity | null>(null)
  const [testFile, setTestFile] = useState<FileEntity | null>(null)
  const [testMultiImages, setTestMultiImages] = useState<FileEntity[]>([])
  const [testMultiFiles, setTestMultiFiles] = useState<FileEntity[]>([])

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card
        title="Workbench"
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                message.success('Test Success')
              }}
            >
              Test Message
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="React + Ant Design Component"
              variant="borderless"
              className="h-full bg-slate-50"
            >
              <Typography.Paragraph type="secondary">
                这张卡片用来承接 React 版工作台的基础组件示例。
              </Typography.Paragraph>
              <Space>
                <Button type="primary">Primary</Button>
                <Button>Default</Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Upload Components Test"
              variant="borderless"
              className="h-full bg-slate-50"
            >
              <Typography.Paragraph type="secondary">
                这里集中演示 React 版上传组件的单文件、多文件和分片上传能力。
              </Typography.Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Image Upload" className="h-full">
              <ImageUpload
                value={testImage}
                onChange={(value) => setTestImage(value as FileEntity | null)}
                businessId={1}
                businessType="demo"
                maxSize={2}
              />
              <JsonPreview value={testImage} />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="File Upload (chunk > 1MB)" className="h-full">
              <FileUpload
                value={testFile}
                onChange={(value) => setTestFile(value as FileEntity | null)}
                businessId={2}
                businessType="demo"
                maxSize={50}
                chunkSize={1}
              />
              <JsonPreview value={testFile} />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Multiple Image Upload" className="h-full">
              <ImageUpload
                value={testMultiImages}
                onChange={(value) => setTestMultiImages((value as FileEntity[]) || [])}
                businessId={3}
                businessType="demo"
                maxSize={2}
                multiple
                max={5}
              />
              <JsonPreview value={testMultiImages} />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Multiple File Upload" className="h-full">
              <FileUpload
                value={testMultiFiles}
                onChange={(value) => setTestMultiFiles((value as FileEntity[]) || [])}
                businessId={4}
                businessType="demo"
                maxSize={50}
                chunkSize={1}
                multiple
                max={5}
              />
              <JsonPreview value={testMultiFiles} />
            </Card>
          </Col>
        </Row>
      </Card>
    </Space>
  )
}
