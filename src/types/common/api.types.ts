export interface Paginated<T> {
  rows: T[]
  total: number
}

export interface ListParams {
  page: number
  search?: string
}

export interface AppErrorShape {
  message: string
  code?: string
}
