import { ref } from 'vue'
import { uploadChunk, mergeChunks, type FileEntity } from '@/api/file'

interface UseChunkUploadOptions {
  chunkSize?: number // 默认 5MB
  concurrentCount?: number // 默认并发数 3
}

export function useChunkUpload(options: UseChunkUploadOptions = {}) {
  const chunkSize = options.chunkSize || 5 * 1024 * 1024
  const concurrentCount = options.concurrentCount || 3

  const isUploading = ref(false)
  const progress = ref(0)

  // 生成唯一 ID
  const generateUploadId = (file: File) => {
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const safeName = baseName
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')

    return `${safeName || 'file'}-${file.size}-${Date.now()}`
  }

  // 切片
  const createChunks = (file: File, size: number) => {
    const chunks: Blob[] = []
    let cur = 0
    while (cur < file.size) {
      chunks.push(file.slice(cur, cur + size))
      cur += size
    }
    return chunks
  }

  const uploadFileChunks = async (
    file: File,
    businessId?: number,
    businessType?: string,
    onProgressUpdate?: (percent: number) => void,
  ): Promise<FileEntity> => {
    isUploading.value = true
    progress.value = 0
    if (onProgressUpdate) onProgressUpdate(0)

    try {
      const chunks = createChunks(file, chunkSize)
      const uploadId = generateUploadId(file)

      const chunkCount = chunks.length
      let uploadedCount = 0

      // 控制并发并发上传
      const uploadChunkWithRetry = async (chunk: Blob, index: number) => {
        return uploadChunk(chunk, {
          uploadId,
          chunkIndex: index,
          totalChunks: chunkCount,
          businessId,
          businessType,
        }).then(() => {
          uploadedCount++
          const percent = Math.round((uploadedCount * 100) / chunkCount)
          const progressValue = percent === 100 ? 99 : percent
          progress.value = progressValue
          if (onProgressUpdate) onProgressUpdate(progressValue)
        })
      }

      // 简单的并发池
      await new Promise<void>((resolve, reject) => {
        let index = 0
        let activeCount = 0
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
            index++
            activeCount++

            if (currentChunk) {
              uploadChunkWithRetry(currentChunk, currentIndex)
                .then(() => {
                  activeCount--
                  next() // 继续下一个任务
                })
                .catch((err) => {
                  hasError = true
                  reject(err)
                })
            }
          }
        }
        next()
      })

      // 合并分片
      const finalUrl = await mergeChunks({
        uploadId,
        totalChunks: chunkCount,
        filename: file.name,
        mimetype: file.type || 'application/octet-stream',
        totalSize: file.size,
        businessId,
        businessType,
      })

      isUploading.value = false
      return finalUrl as unknown as FileEntity // 返回完整的合并后文件对象
    } catch (err) {
      isUploading.value = false
      throw err
    }
  }

  return {
    isUploading,
    progress,
    uploadFileChunks,
  }
}
