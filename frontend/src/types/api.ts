export interface ApiError {
  message: string
  statusCode?: number
  details?: unknown
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuthResponse<TUser> {
  token: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: TUser
}

export type ProductSort = 'new' | 'price_asc' | 'price_desc'

export interface ProductFilters {
  q?: string
  category_id?: string
  sort?: ProductSort
  page?: number
  limit?: number
  // legacy aliases for existing components/utilities
  query?: string
  category?: string
  pageSize?: number
}
