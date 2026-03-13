export type UserRole = 'guest' | 'customer' | 'seller' | 'admin'

export interface User {
  id: string
  email: string
  fullName?: string
  isActive?: boolean
  // legacy fields kept for compatibility with non-active screens
  name?: string
  role?: UserRole
  isBlocked?: boolean
  phone?: string
  avatarUrl?: string
}

export interface Category {
  id: string
  name: string
  slug?: string
  parentId?: string
  children?: Category[]
}

export interface Product {
  id: string
  title: string
  name?: string
  slug?: string
  description: string
  price: number
  currency?: string
  rating: number
  images: string[]
  categoryId: string
  categoryName?: string
  sellerId?: string
  stock?: number
  isPublished?: boolean
  isActive?: boolean
  isFavorite?: boolean
}

export interface Place {
  id: string
  title: string
  addressText: string
  lat?: number
  lon?: number
  createdAt?: string
  updatedAt?: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  title: string
  imageUrl?: string
  price: number
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  currency: string
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderAddress {
  city: string
  street: string
  building: string
  postalCode: string
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  currency: string
  status: OrderStatus
  createdAt: string
  address: OrderAddress
  deliveryMethod: string
  promoCode?: string
}

export interface AdminStats {
  totalOrders: number
  totalUsers: number
  totalProducts: number
  activeSellers: number
}
