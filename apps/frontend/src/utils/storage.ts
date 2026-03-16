// 默认缓存前缀
const DEFAULT_PREFIX = 'prime_admin_'

interface StorageData<T> {
  value: T
  expire: number | null | undefined
}

class StorageWrapper {
  private storage: Storage
  private prefix: string

  constructor(storage: Storage = localStorage, prefix: string = DEFAULT_PREFIX) {
    this.storage = storage
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key.toUpperCase()}`
  }

  /**
   * Set storage
   * @param key Storage key
   * @param value Storage value
   * @param expire Expiration: number (seconds), Date object, or Date string (e.g. RFC3339 '2026-01-30T11:06:43+08:00')
   */
  set<T = unknown>(key: string, value: T, expire: number | Date | string | null = null): void {
    let expireTime: number | null = null

    if (expire !== null) {
      if (typeof expire === 'number') {
        // Relative time in seconds
        expireTime = new Date().getTime() + expire * 1000
      } else if (expire instanceof Date) {
        // Absolute Date
        expireTime = expire.getTime()
      } else if (typeof expire === 'string') {
        // Date string (e.g. RFC3339)
        const parsedDate = new Date(expire)
        // Check if date is valid
        if (!isNaN(parsedDate.getTime())) {
          expireTime = parsedDate.getTime()
        } else {
          console.warn(`Invalid expiration date string: ${expire}`)
        }
      }
    }

    const stringData = JSON.stringify({
      value,
      expire: expireTime,
    } as StorageData<T>)
    this.storage.setItem(this.getKey(key), stringData)
  }

  /**
   * Get storage
   * @param key Storage key
   * @returns Parsed value or null if not found/expired
   */
  get<T = unknown>(key: string): T | null {
    const item = this.storage.getItem(this.getKey(key))
    if (!item) {
      return null
    }

    try {
      const data = JSON.parse(item) as StorageData<T>
      const { value, expire } = data

      // Check expiration
      if (expire && expire < new Date().getTime()) {
        this.remove(key)
        return null
      }

      return value
    } catch {
      return null
    }
  }

  /**
   * Remove storage item
   * @param key Storage key
   */
  remove(key: string): void {
    this.storage.removeItem(this.getKey(key))
  }

  /**
   * Clear all storage items with the current prefix
   */
  clear(): void {
    Object.keys(this.storage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key)
      }
    })
  }

  /**
   * Change prefix
   * @param prefix new prefix
   */
  setPrefix(prefix: string) {
    this.prefix = prefix
  }
}

export const localCache = new StorageWrapper(localStorage)
export const sessionCache = new StorageWrapper(sessionStorage)

export default StorageWrapper
