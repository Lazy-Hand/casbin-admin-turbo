import { useEffect, useMemo, useRef, useState } from 'react'
import { App, Button, Progress, Space, Upload } from 'antd'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudUploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { uploadSingle, type FileEntity } from '@/api/file'
import { useChunkUpload } from '@/hooks/useChunkUpload'

type Props = {
  value?: FileEntity | FileEntity[] | null
  onChange?: (value: FileEntity | FileEntity[] | null) => void
  businessId?: number
  businessType?: string
  accept?: string
  maxSize?: number
  chunkSize?: number
  max?: number
  multiple?: boolean
}

function normalizeValue(value?: FileEntity | FileEntity[] | null) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return '0 B'
  const k = 1024
  if (bytes < k) return `${bytes} B`
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = ['B', 'KB', 'MB', 'GB', 'TB'][i] || 'TB'
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${unit}`
}

function formatDate(timestamp: number | undefined) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp)
}

export function FileUpload({
  value,
  onChange,
  businessId,
  businessType,
  accept,
  maxSize = 100,
  chunkSize = 5,
  max = 1,
  multiple = false,
}: Props) {
  const { message } = App.useApp()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const fileRecordMap = useRef(new Map<string, FileEntity>())
  const { uploadFileChunks } = useChunkUpload({
    chunkSize: chunkSize * 1024 * 1024,
    concurrentCount: 3,
  })

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

          const uid = `file-v-${record.id ?? Date.now()}-${index}`
          fileRecordMap.current.set(uid, record)

          return {
            uid,
            name: record.originalName || record.filename || `file-${index}`,
            status: 'done' as const,
            url: record.url,
            size: record.size,
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

    if (accept) {
      const fileExtension = realFile.name.slice(realFile.name.lastIndexOf('.')).toLowerCase()
      const allowedExtensions = accept.split(',').map((item) => item.trim().toLowerCase())
      const isAllowed = allowedExtensions.some(
        (ext) =>
          ext === fileExtension ||
          ext === '.*' ||
          (ext.includes('/') && new RegExp(ext.replace('*', '.*')).test(realFile.type)),
      )

      if (!isAllowed) {
        message.error(`不支持该文件格式，仅支持: ${accept}`)
        return Upload.LIST_IGNORE
      }
    }

    if (realFile.size / 1024 / 1024 > maxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB`)
      return Upload.LIST_IGNORE
    }

    return true
  }

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const uploadFile = options.file as RcFile & { uid: string }
    const realFile = uploadFile

    try {
      const record =
        realFile.size > chunkSize * 1024 * 1024
          ? await uploadFileChunks(realFile, businessId, businessType, (percent) => {
              options.onProgress?.({ percent })
            })
          : await uploadSingle(
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

  const renderList = (
    <div className="space-y-3">
      {fileList.map((file) => (
        <div key={file.uid} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-800">{file.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                大小: {formatSize(file.size)}{' '}
                {file.status === 'done' ? '' : `· 状态: ${file.status}`}
              </div>
              {typeof file.percent === 'number' && file.status === 'uploading' ? (
                <Progress percent={Math.round(file.percent)} size="small" className="mt-3" />
              ) : null}
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                fileRecordMap.current.delete(file.uid)
                const nextList = fileList.filter((item) => item.uid !== file.uid)
                setFileList(nextList)
                emitValue(nextList)
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderStatus = (file: UploadFile) => {
    if (file.status === 'uploading') {
      return (
        <>
          <LoadingOutlined className="text-blue-500" />
          <span className="text-sm text-blue-500">{Math.round(file.percent ?? 0)}%</span>
        </>
      )
    }

    if (file.status === 'done') {
      return <CheckCircleFilled className="text-green-500" />
    }

    if (file.status === 'error') {
      return <CloseCircleFilled className="text-red-500" />
    }

    return null
  }

  const singleFile = !multiple && fileList.length > 0 ? fileList[0] : null
  const showSingleCard = !multiple && singleFile
  const showDropZone = multiple || fileList.length === 0

  return (
    <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-1">
      <div
        className={`rounded-md border-2 border-dashed border-blue-300 bg-blue-50/40 p-4 transition-colors ${
          showDropZone ? 'flex min-h-30 items-center justify-center' : ''
        }`}
      >
        <div className={showDropZone ? 'w-full' : 'hidden'}>
          <Upload.Dragger
            accept={accept}
            maxCount={max}
            multiple={multiple}
            showUploadList={false}
            fileList={fileList}
            beforeUpload={beforeUpload}
            customRequest={customRequest}
            onChange={({ fileList: nextList }) => {
              setFileList(nextList)
              emitValue(nextList)
            }}
            className="border-none! bg-transparent!"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined className="text-blue-500" />
            </p>
            <p className="ant-upload-text">
              <span className="font-medium text-blue-500">点击上传</span>
              <span className="text-slate-400"> / 拖拽到此区域</span>
            </p>
            <p className="ant-upload-hint">请上传文件，单个文件大小在 {maxSize}MB 以内</p>
          </Upload.Dragger>
        </div>

        {showSingleCard && singleFile ? (
          <div className="w-full bg-white p-2">
            <div className="flex items-start gap-4 rounded-md bg-white p-4">
              <FileTextOutlined className="mt-1 text-[36px] text-blue-500" />

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="truncate text-slate-800" title={singleFile.name}>
                    {singleFile.name}
                  </span>
                  {renderStatus(singleFile)}
                </div>

                <div className="mb-4 flex gap-4 text-sm text-slate-400">
                  {singleFile.size ? <span>大小: {formatSize(singleFile.size)}</span> : null}
                  {'originFileObj' in singleFile && singleFile.originFileObj?.lastModified ? (
                    <span>日期: {formatDate(singleFile.originFileObj.lastModified)}</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {singleFile.status === 'uploading' ? (
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 text-blue-500"
                      onClick={() => {
                        fileRecordMap.current.delete(singleFile.uid)
                        const nextList = fileList.filter((item) => item.uid !== singleFile.uid)
                        setFileList(nextList)
                        emitValue(nextList)
                      }}
                    >
                      取消上传
                    </button>
                  ) : (
                    <>
                      <Upload
                        accept={accept}
                        maxCount={1}
                        multiple={false}
                        showUploadList={false}
                        beforeUpload={(file, nextFileList) => {
                          setFileList([])
                          return beforeUpload(file, nextFileList)
                        }}
                        customRequest={customRequest}
                        onChange={({ fileList: nextList }) => {
                          setFileList(nextList)
                          emitValue(nextList)
                        }}
                      >
                        <button
                          type="button"
                          className="cursor-pointer border-0 bg-transparent p-0 text-blue-500"
                        >
                          重新上传
                        </button>
                      </Upload>
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-blue-500"
                        onClick={() => {
                          fileRecordMap.current.delete(singleFile.uid)
                          const nextList = fileList.filter((item) => item.uid !== singleFile.uid)
                          setFileList(nextList)
                          emitValue(nextList)
                        }}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>

                {singleFile.status === 'error' ? (
                  <div className="mt-4 text-sm text-red-500">网络异常或上传失败</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {multiple && fileList.length > 0 ? <div className="mt-4 px-2 pb-2">{renderList}</div> : null}

      {!multiple && fileList.length > 0 && !showSingleCard ? (
        <Space className="mt-3">
          <Upload
            accept={accept}
            maxCount={1}
            multiple={false}
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={customRequest}
            onChange={({ fileList: nextList }) => {
              setFileList(nextList)
              emitValue(nextList)
            }}
          >
            <Button icon={<UploadOutlined />}>重新上传</Button>
          </Upload>
        </Space>
      ) : null}
    </div>
  )
}
