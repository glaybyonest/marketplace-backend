import type { ProductFilters } from '@/types/api'

const numberFields = new Set(['page', 'limit'])

export const searchParamsToFilters = (searchParams: URLSearchParams): ProductFilters => {
  const filters: ProductFilters = {}

  searchParams.forEach((value, key) => {
    if (!value) {
      return
    }

    if (numberFields.has(key)) {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        ;(filters as Record<string, number>)[key] = parsed
      }
      return
    }

    ;(filters as Record<string, string>)[key] = value
  })

  return filters
}

export const filtersToSearchParams = (filters: ProductFilters): URLSearchParams => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    params.set(key, String(value))
  })

  return params
}
