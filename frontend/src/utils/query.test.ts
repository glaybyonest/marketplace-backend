import { describe, expect, it } from 'vitest'

import { filtersToSearchParams, searchParamsToFilters } from '@/utils/query'

describe('query utils', () => {
  it('converts search params to backend-compatible filters', () => {
    const params = new URLSearchParams('q=laptop&category_id=cat-1&sort=price_desc&page=2&limit=24')
    const filters = searchParamsToFilters(params)

    expect(filters).toEqual({
      q: 'laptop',
      category_id: 'cat-1',
      sort: 'price_desc',
      page: 2,
      limit: 24,
    })
  })

  it('converts filters back to URL params', () => {
    const params = filtersToSearchParams({
      q: 'phone',
      category_id: 'cat-2',
      sort: 'new',
      page: 1,
      limit: 12,
    })

    expect(params.get('q')).toBe('phone')
    expect(params.get('category_id')).toBe('cat-2')
    expect(params.get('sort')).toBe('new')
    expect(params.get('page')).toBe('1')
    expect(params.get('limit')).toBe('12')
  })
})
