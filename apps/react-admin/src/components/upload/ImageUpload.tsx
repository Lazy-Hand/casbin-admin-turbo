import { useEffect, useMemo, useRef, useState } from 'react'
import { App, Upload } from 'antd'
import type { UploadFile, UploadProps, RcFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import { uploadSingle, type FileEntity } from '@/api/file'

type Props = {
  value?: FileEntity | FileEntity[] | null
  onChange?: (value: FileEntity | FileEntity[] | null) => void
  businessId?: number
  businessType?: string
  maxSize?: number
  max?: number
  multiple?: boolean
}

function normalizeValue(value?: FileEntity | FileEntity[] | null) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function ImageUpload({
  value,
  onChange,
  businessId,
  businessType,
  maxSize = 5,
  max = 1,
  multiple = false,
}: Props) {
  const { message } = App.useApp()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const fileRecordMap = useRef(new Map<string, FileEntity>())

  const records = useMemo(() => normalizeValue(value), [value])

  useEffect(() => {
    setFileList((current) => {
      const nextFinished = records
        .filter((record) => record?.url)
        .map((record, index) => {
          const existing = current.find((file) => file.status === 'done' && file.url === record.url)
          if (existing) {
            fileRecordMap.current.set(existing.uid, record)
            return existing
          }

          const uid = `img-v-${record.id ?? Date.now()}-${index}`
          fileRecordMap.current.set(uid, record)

          return {
            uid,
            name: record.originalName || record.filename || `image-${index}`,
            status: 'done' as const,
            url: record.url,
          }
        })

      const pending = current.filter((file) => file.status !== 'done')
      return [...nextFinished, ...pending]
    })
  }, [records])

  const emitValue = (nextList: UploadFile[]) => {
    const finishedRecords = nextList
      .filter((file) => file.status === 'done')
      .map((file) => fileRecordMap.current.get(file.uid))
      .filter((item): item is FileEntity => Boolean(item))

    if (!multiple && max === 1) {
      onChange?.(finishedRecords[0] ?? null)
      return
    }

    onChange?.(finishedRecords)
  }

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const realFile = file as RcFile

    if (!realFile.type.startsWith('image/')) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }

    if (realFile.size / 1024 / 1024 > maxSize) {
      message.error(`图片大小不能超过 ${maxSize}MB`)
      return Upload.LIST_IGNORE
    }

    return true
  }

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const uploadFile = options.file as RcFile & { uid: string }
    const realFile = uploadFile

    try {
      const record = await uploadSingle(
        realFile,
        {
          businessId,
          businessType,
        },
        (progressEvent) => {
          if (progressEvent.total) {
            options.onProgress?.({
              percent: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            })
          }
        },
      )

      fileRecordMap.current.set(uploadFile.uid, record)
      options.onSuccess?.(record)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传失败')
      options.onError?.(error as Error)
    }
  }

  return (
    <Upload
      accept="image/*"
      listType="picture-card"
      maxCount={max}
      multiple={multiple}
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      onChange={({ fileList: nextList }) => {
        setFileList(nextList)
        emitValue(nextList)
      }}
      onRemove={(file) => {
        fileRecordMap.current.delete(file.uid)
        const nextList = fileList.filter((item) => item.uid !== file.uid)
        setFileList(nextList)
        emitValue(nextList)
        return true
      }}
    >
      {(!multiple && fileList.length >= max) || (multiple && fileList.length >= max) ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传图片</div>
        </div>
      )}
    </Upload>
  )
}
