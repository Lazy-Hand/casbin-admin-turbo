export type PageResponse<T> = {
  list: T[]
  total: number
  pageNo: number
  pageSize: number
}
