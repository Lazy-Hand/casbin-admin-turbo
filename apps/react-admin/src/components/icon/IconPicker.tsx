import { App, Empty, Input, Modal, Pagination, Segmented, Space, Spin, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { DynamicIcon } from '@/components/DynamicIcon'
import { useIconLoader, type IconLibraryKey } from '@/components/icon/useIconLoader'

const libraryOptions: { label: string; value: IconLibraryKey }[] = [
  { label: 'Ant Design', value: 'antd' },
  { label: 'Material', value: 'material' },
  { label: 'Ionicons5', value: 'ionicons5' },
]

type Props = {
  open: boolean
  value?: string
  onClose: () => void
  onSelect: (icon: string) => void
}

export function IconPicker({ open, value, onClose, onSelect }: Props) {
  const { message } = App.useApp()
  const { loadIcons, loadingMap, getIcons, pageSize } = useIconLoader()
  const [library, setLibrary] = useState<IconLibraryKey>('antd')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!open) {
      return
    }

    void loadIcons(library).catch(() => {
      message.error('图标库加载失败')
    })
  }, [library, loadIcons, message, open])

  useEffect(() => {
    setPage(1)
  }, [keyword, library])

  const { items, total } = useMemo(
    () => getIcons(library, keyword, page),
    [getIcons, keyword, library, page],
  )

  return (
    <Modal
      open={open}
      title="选择图标"
      width={920}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
          <Segmented<IconLibraryKey>
            options={libraryOptions}
            value={library}
            onChange={(next) => setLibrary(next)}
          />
          <Input.Search
            allowClear
            placeholder="搜索图标名"
            style={{ width: 280 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>

        {loadingMap[library] ? (
          <div style={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
            <Spin />
          </div>
        ) : items.length ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12,
                minHeight: 360,
              }}
            >
              {items.map((item) => {
                const active = value === item.icon

                return (
                  <button
                    key={item.icon}
                    type="button"
                    onClick={() => {
                      onSelect(item.icon)
                      onClose()
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      minHeight: 106,
                      padding: 14,
                      borderRadius: 16,
                      border: active ? '1px solid #1677ff' : '1px solid rgba(221,230,242,0.95)',
                      background: active ? 'rgba(22,119,255,0.08)' : '#fff',
                      boxShadow: active ? '0 10px 28px -22px rgba(22,119,255,0.9)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <DynamicIcon icon={item.icon} className="size-5" />
                    <Space
                      direction="vertical"
                      size={2}
                      style={{ display: 'flex', textAlign: 'center' }}
                    >
                      <Typography.Text style={{ fontSize: 12 }}>{item.displayName}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {item.name}
                      </Typography.Text>
                    </Space>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger={false}
                onChange={setPage}
              />
            </div>
          </>
        ) : (
          <div style={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
            <Empty description="没有匹配的图标" />
          </div>
        )}
      </Space>
    </Modal>
  )
}
