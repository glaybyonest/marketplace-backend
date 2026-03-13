import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Product } from '@/types/domain'
import { formatCurrency } from '@/utils/format'

import styles from '@/components/catalog/ProductCard.module.scss'

interface ProductCardProps {
  product: Product
}

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '??',
  phones: '??',
  computers: '??',
  laptops: '??',
  tablets: '??',
  accessories: '?',
  clothing: '??',
  shoes: '??',
  books: '??',
  home: '??',
  furniture: '???',
  sports: '?',
  toys: '??',
  beauty: '??',
  food: '??',
  default: '??',
}

const getCategoryIcon = (categoryName: string): string => {
  const key = categoryName?.toLowerCase() || 'default'
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default
}

const StarRating = ({ rating }: { rating: number }) => {
  const safeRating = Number.isFinite(rating) ? rating : 0
  const fullStars = Math.floor(safeRating)
  const hasHalfStar = safeRating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={styles.stars}>
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className={styles.starFilled}>?</span>
      ))}
      {hasHalfStar && <span className={styles.starHalf}>?</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className={styles.starEmpty}>?</span>
      ))}
      <span className={styles.ratingValue}>{safeRating.toFixed(1)}</span>
    </div>
  )
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const image = product.images[0] ?? 'https://placehold.co/320x240?text=No+Image'
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const categoryIcon = getCategoryIcon(product.categoryName || '')

  return (
    <article
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.id}`} className={styles.imageWrap}>
        <div className={`${styles.skeleton} ${imageLoaded ? styles.hidden : ''}`} />
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          className={imageLoaded ? styles.loaded : ''}
          onLoad={() => setImageLoaded(true)}
        />

        <div className={`${styles.overlay} ${isHovered ? styles.visible : ''}`}>
          <span className={styles.addToCartBtn}>Open details</span>
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.categoryRow}>
          <span className={styles.categoryIcon}>{categoryIcon}</span>
          <span className={styles.category}>{product.categoryName || 'Category'}</span>
        </div>

        <h3>
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>

        <StarRating rating={product.rating} />

        <div className={styles.priceRow}>
          <span className={styles.price}>{formatCurrency(product.price, product.currency)}</span>
        </div>
      </div>
    </article>
  )
}
