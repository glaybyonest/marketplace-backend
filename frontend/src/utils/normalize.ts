import type {
  AdminStats,
  Cart,
  CartItem,
  Category,
  Order,
  Place,
  Product,
  Review,
  User,
  UserRole,
} from '@/types/domain'

const asRecord = (value: unknown): Record<string, unknown> => (value as Record<string, unknown>) ?? {}

const pickString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

const pickNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const ensureRole = (value: unknown, hasIdentity = false): UserRole => {
  if (value === 'customer' || value === 'seller' || value === 'admin') {
    return value
  }
  return hasIdentity ? 'customer' : 'guest'
}

const createId = () => {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

export const normalizeUser = (input: unknown): User => {
  const source = asRecord(input)
  const email = pickString(source.email)
  const fullName = pickString(source.full_name, pickString(source.fullName, pickString(source.name)))

  return {
    id: pickString(source.id, pickString(source._id, createId())),
    email,
    fullName,
    isActive: source.is_active === undefined ? true : Boolean(source.is_active),
    name: fullName || 'User',
    role: ensureRole(source.role, Boolean(email)),
    isBlocked: Boolean(source.isBlocked),
    phone: pickString(source.phone),
    avatarUrl: pickString(source.avatarUrl, pickString(source.avatar)),
  }
}

export const normalizeCategory = (input: unknown): Category => {
  const source = asRecord(input)
  const category: Category = {
    id: pickString(source.id, pickString(source._id, createId())),
    name: pickString(source.name, 'Uncategorized'),
    slug: pickString(source.slug),
    parentId: pickString(source.parent_id, pickString(source.parentId)),
  }

  if (Array.isArray(source.children)) {
    category.children = source.children.map(normalizeCategory)
  }

  return category
}

export const normalizeProduct = (input: unknown): Product => {
  const source = asRecord(input)
  const rawImages = Array.isArray(source.images) ? source.images : [source.image]
  const images = rawImages.filter((image): image is string => typeof image === 'string' && image.length > 0)

  return {
    id: pickString(source.id, pickString(source._id, createId())),
    title: pickString(source.title, pickString(source.name, 'Product')),
    name: pickString(source.name, pickString(source.title, 'Product')),
    slug: pickString(source.slug),
    description: pickString(source.description),
    price: pickNumber(source.price),
    currency: pickString(source.currency, 'RUB'),
    rating: pickNumber(source.rating, 0),
    images,
    categoryId: pickString(source.category_id, pickString(source.categoryId, pickString(source.category, ''))),
    categoryName: pickString(source.categoryName, pickString(source.category_name)),
    sellerId: pickString(source.sellerId),
    stock: pickNumber(source.stock_qty, pickNumber(source.stock, 0)),
    isPublished: source.isPublished === undefined ? Boolean(source.is_active ?? true) : Boolean(source.isPublished),
    isActive: source.is_active === undefined ? true : Boolean(source.is_active),
  }
}

export const normalizePlace = (input: unknown): Place => {
  const source = asRecord(input)
  return {
    id: pickString(source.id, createId()),
    title: pickString(source.title),
    addressText: pickString(source.address_text, pickString(source.addressText)),
    lat: typeof source.lat === 'number' ? source.lat : undefined,
    lon: typeof source.lon === 'number' ? source.lon : undefined,
    createdAt: pickString(source.created_at, pickString(source.createdAt)),
    updatedAt: pickString(source.updated_at, pickString(source.updatedAt)),
  }
}

export const normalizeReview = (input: unknown): Review => {
  const source = asRecord(input)
  return {
    id: pickString(source.id, pickString(source._id, createId())),
    productId: pickString(source.productId),
    userId: pickString(source.userId),
    userName: pickString(source.userName, pickString(source.authorName, 'Buyer')),
    rating: pickNumber(source.rating),
    comment: pickString(source.comment, pickString(source.text)),
    createdAt: pickString(source.createdAt, new Date().toISOString()),
  }
}

export const normalizeCartItem = (input: unknown): CartItem => {
  const source = asRecord(input)
  return {
    id: pickString(source.id, pickString(source._id, createId())),
    productId: pickString(source.productId),
    title: pickString(source.title, pickString(source.productTitle, 'Product')),
    imageUrl: pickString(source.imageUrl, pickString(source.image)),
    price: pickNumber(source.price),
    quantity: pickNumber(source.quantity, 1),
  }
}

export const normalizeCart = (input: unknown): Cart => {
  const source = asRecord(input)
  const rawItems = Array.isArray(source.items) ? source.items : []
  const items = rawItems.map(normalizeCartItem)
  const total = pickNumber(source.total, NaN) || items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  return {
    items,
    total,
    currency: pickString(source.currency, 'RUB'),
  }
}

export const normalizeOrder = (input: unknown): Order => {
  const source = asRecord(input)
  const rawItems = Array.isArray(source.items) ? source.items : []
  const address = asRecord(source.address)
  return {
    id: pickString(source.id, pickString(source._id, createId())),
    items: rawItems.map(normalizeCartItem),
    total: pickNumber(source.total),
    currency: pickString(source.currency, 'RUB'),
    status: pickString(source.status, 'pending') as Order['status'],
    createdAt: pickString(source.createdAt, new Date().toISOString()),
    address: {
      city: pickString(address.city),
      street: pickString(address.street),
      building: pickString(address.building),
      postalCode: pickString(address.postalCode),
    },
    deliveryMethod: pickString(source.deliveryMethod, 'standard'),
    promoCode: pickString(source.promoCode),
  }
}

export const normalizeAdminStats = (input: unknown): AdminStats => {
  const source = asRecord(input)
  return {
    totalOrders: pickNumber(source.totalOrders),
    totalUsers: pickNumber(source.totalUsers),
    totalProducts: pickNumber(source.totalProducts),
    activeSellers: pickNumber(source.activeSellers),
  }
}
