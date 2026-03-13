import type { PaginatedResponse } from '@/types/api'

const asRecord = (value: unknown): Record<string, unknown> => (value as Record<string, unknown>) ?? {}

export const pickData = <T>(raw: unknown): T => {
  const source = asRecord(raw)
  if (Object.prototype.hasOwnProperty.call(source, 'data')) {
    return source.data as T
  }
  return raw as T
}

export const toPaginated = <T>(raw: unknown): PaginatedResponse<T> => {
  const source = asRecord(pickData<unknown>(raw))
  const items = (Array.isArray(source.items) ? source.items : []) as T[]

  const total = Number(source.total ?? items.length) || items.length
  const page = Number(source.page ?? 1) || 1
  const rawPageSize = source.limit ?? source.pageSize ?? items.length ?? 1
  const pageSize = Number(rawPageSize) || 1
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export const toErrorMessage = (raw: unknown, fallback: string): string => {
  const source = asRecord(raw)
  const error = asRecord(source.error)
  const message = error.message
  if (typeof message === 'string' && message.trim().length > 0) {
    return message
  }
  return fallback
}
