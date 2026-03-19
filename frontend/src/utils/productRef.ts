import type { CartItem, Product } from '@/types/domain'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ProductRouteInput =
  | Pick<Product, 'id' | 'slug'>
  | Pick<CartItem, 'productId' | 'slug'>

export const isUUIDLike = (value: string) => UUID_PATTERN.test(value.trim())

export const getProductRef = (input: ProductRouteInput): string => {
  const slug = input.slug?.trim()
  if (slug) {
    return slug
  }

  if ('id' in input) {
    return input.id.trim()
  }

  return input.productId.trim()
}

export const getProductPath = (input: ProductRouteInput): string =>
  `/products/${encodeURIComponent(getProductRef(input))}`
