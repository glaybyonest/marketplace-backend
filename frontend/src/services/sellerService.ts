import { apiClient } from '@/services/apiClient'
import { pickData, toPaginated } from '@/services/serviceUtils'
import type { PaginatedResponse, ProductFilters } from '@/types/api'
import type { Product, SellerDashboard, SellerOrderSummary, SellerProfile, SellerStatus } from '@/types/domain'
import {
  normalizeProduct,
  normalizeSellerDashboard,
  normalizeSellerOrderSummary,
  normalizeSellerProfile,
} from '@/utils/normalize'

interface SellerProfilePayload {
  storeName: string
  storeSlug?: string
  legalName?: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  supportEmail?: string
  supportPhone?: string
  city?: string
  status?: SellerStatus
}

interface SellerProductPayload {
  title?: string
  name?: string
  slug?: string
  description: string
  price: number
  categoryId: string
  currency?: string
  sku?: string
  imageUrl?: string
  stock?: number
  images?: string[]
  brand?: string
  unit?: string
  specs?: Product['specs']
  isActive?: boolean
}

const mapFilters = (filters: ProductFilters = {}) => {
  const params: Record<string, string | number | boolean> = {}

  const q = filters.q ?? filters.query
  const categoryId = filters.category_id ?? filters.category
  const minPrice = filters.min_price ?? filters.minPrice
  const maxPrice = filters.max_price ?? filters.maxPrice
  const inStock = filters.in_stock ?? filters.inStock
  const isActive = filters.is_active ?? filters.isActive
  const limit = filters.limit ?? filters.pageSize

  if (q) {
    params.q = q
  }
  if (categoryId) {
    params.category_id = categoryId
  }
  if (filters.sort) {
    params.sort = filters.sort
  }
  if (typeof minPrice === 'number') {
    params.min_price = minPrice
  }
  if (typeof maxPrice === 'number') {
    params.max_price = maxPrice
  }
  if (typeof inStock === 'boolean') {
    params.in_stock = inStock
  }
  if (typeof isActive === 'boolean') {
    params.is_active = isActive
  }
  if (filters.page) {
    params.page = filters.page
  }
  if (limit) {
    params.limit = limit
  }

  return params
}

const toProductRequestBody = (payload: SellerProductPayload) => ({
  category_id: payload.categoryId,
  name: payload.name ?? payload.title ?? 'Product',
  slug: payload.slug,
  description: payload.description,
  price: payload.price,
  currency: payload.currency,
  sku: payload.sku,
  image_url: payload.imageUrl,
  images: payload.images ?? [],
  brand: payload.brand,
  unit: payload.unit,
  specs: payload.specs ?? {},
  stock_qty: payload.stock ?? 0,
  is_active: payload.isActive,
})

export const sellerService = {
  async getProfile(): Promise<SellerProfile> {
    const response = await apiClient.get('/v1/seller/profile')
    return normalizeSellerProfile(pickData(response.data))
  },

  async upsertProfile(payload: SellerProfilePayload): Promise<SellerProfile> {
    const response = await apiClient.put('/v1/seller/profile', {
      store_name: payload.storeName,
      store_slug: payload.storeSlug,
      legal_name: payload.legalName,
      description: payload.description,
      logo_url: payload.logoUrl,
      banner_url: payload.bannerUrl,
      support_email: payload.supportEmail,
      support_phone: payload.supportPhone,
      city: payload.city,
      status: payload.status,
    })
    return normalizeSellerProfile(pickData(response.data))
  },

  async getDashboard(): Promise<SellerDashboard> {
    const response = await apiClient.get('/v1/seller/dashboard')
    return normalizeSellerDashboard(pickData(response.data))
  },

  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get('/v1/seller/products', { params: mapFilters(filters) })
    const paginated = toPaginated<unknown>(response.data)
    return {
      ...paginated,
      items: paginated.items.map(normalizeProduct),
    }
  },

  async createProduct(payload: SellerProductPayload): Promise<Product> {
    const response = await apiClient.post('/v1/seller/products', toProductRequestBody(payload))
    return normalizeProduct(pickData(response.data))
  },

  async updateProduct(id: string, payload: SellerProductPayload): Promise<Product> {
    const response = await apiClient.patch(`/v1/seller/products/${id}`, toProductRequestBody(payload))
    return normalizeProduct(pickData(response.data))
  },

  async updateProductStock(id: string, stockQty: number): Promise<Product> {
    const response = await apiClient.patch(`/v1/seller/products/${id}/stock`, {
      stock_qty: stockQty,
    })
    return normalizeProduct(pickData(response.data))
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/v1/seller/products/${id}`)
  },

  async getOrders(page = 1, limit = 20): Promise<PaginatedResponse<SellerOrderSummary>> {
    const response = await apiClient.get('/v1/seller/orders', { params: { page, limit } })
    const paginated = toPaginated<unknown>(response.data)
    return {
      ...paginated,
      items: paginated.items.map(normalizeSellerOrderSummary),
    }
  },
}
