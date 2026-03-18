import { useMemo } from 'react'
import { mergeChunks, uploadChunk, type FileEntity } from '@/api/file'

interface UseChunkUploadOptions {
  chunkSize?: number
  concurrentCount?: number
}

function generateUploadId(file: File) {
  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const safeName = baseName
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${safeName || 'file'}-${file.size}-${Date.now()}`
}

function createChunks(file: File, size: number) {
  const chunks: Blob[] = []
  let cursor = 0
  while (cursor < file.size) {
    chunks.push(file.slice(cursor, cursor + size))
    cursor += size
  }
  return chunks
}

export function useChunkUpload(options: UseChunkUploadOptions = {}) {
  const chunkSize = options.chunkSize || 5 * 1024 * 1024
  const concurrentCount = options.concurrentCount || 3

  return useMemo(
    () => ({
      uploadFileChunks: async (
        file: File,
        businessId?: number,
        businessType?: string,
        onProgressUpdate?: (percent: number) => void,
      ): Promise<FileEntity> => {
        const chunks = createChunks(file, chunkSize)
        const uploadId = generateUploadId(file)
        const chunkCount = chunks.length
        let uploadedCount = 0

        const uploadSingleChunk = async (chunk: Blob, index: number) => {
          await uploadChunk(chunk, {
            uploadId,
            chunkIndex: index,
            totalChunks: chunkCount,
            businessId,
            businessType,
          })
          uploadedCount += 1
          const percent = Math.round((uploadedCount * 100) / chunkCount)
          onProgressUpdate?.(percent === 100 ? 99 : percent)
        }

        await new Promise<void>((resolve, reject) => {
          let activeCount = 0
          let index = 0
          let hasError = false

          const next = () => {
            if (hasError) return
            if (uploadedCount === chunkCount) {
              resolve()
              return
            }

            while (activeCount < concurrentCount && index < chunkCount) {
              const currentIndex = index
              const currentChunk = chunks[currentIndex]
              index += 1
              activeCount += 1

              if (!currentChunk) {
                activeCount -= 1
                continue
              }

              void uploadSingleChunk(currentChunk, currentIndex)
                .then(() => {
                  activeCount -= 1
                  next()
                })
                .catch((error) => {
                  hasError = true
                  reject(error)
                })
            }
          }

          next()
        })

        onProgressUpdate?.(100)

        return mergeChunks({
          uploadId,
          totalChunks: chunkCount,
          filename: file.name,
          mimetype: file.type || 'application/octet-stream',
          totalSize: file.size,
          businessId,
          businessType,
        })
      },
    }),
    [chunkSize, concurrentCount],
  )
}
