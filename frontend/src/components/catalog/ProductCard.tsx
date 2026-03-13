import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { Product } from '@/types/domain'
import { formatCurrency } from '@/utils/format'

import styles from '@/components/catalog/ProductCard.module.scss'

interface ProductCardProps {
  product: Product
}

const FALLBACK_IMAGE = 'https://placehold.co/1200x900/f3f4f6/6b7280?text=No+Image'

const formatSpecValue = (value: string | number | boolean | null) => {
  if (value === null) {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const image = product.imageUrl ?? product.images[0] ?? FALLBACK_IMAGE

  const specPreview = useMemo(() => {
    return Object.entries(product.specs ?? {}).slice(0, 2)
  }, [product.specs])

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.id}`} className={styles.imageWrap}>
        {!imageLoaded ? <div className={styles.skeleton} /> : null}
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          className={imageLoaded ? styles.imageLoaded : styles.image}
          onLoad={() => setImageLoaded(true)}
        />
        <span
          className={`${styles.stockBadge} ${
            product.stock && product.stock > 0 ? styles.stockBadgeActive : styles.stockBadgeEmpty
          }`}
        >
          {product.stock && product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </span>
      </Link>

      <div className={styles.body}>
        <div className={styles.metaRow}>
          <span className={styles.category}>{product.categoryName || 'Catalog'}</span>
          {product.brand ? <span className={styles.brand}>{product.brand}</span> : null}
        </div>

        <h3 className={styles.title}>
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>

        {specPreview.length > 0 ? (
          <ul className={styles.specList}>
            {specPreview.map(([key, value]) => (
              <li key={key}>
                <span>{key.replaceAll('_', ' ')}</span>
                <strong>{formatSpecValue(value)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.description}>{product.description || 'Open the product to see details.'}</p>
        )}

        <div className={styles.footerRow}>
          <div className={styles.priceBlock}>
            <strong className={styles.price}>{formatCurrency(product.price, product.currency)}</strong>
            {product.unit ? <span className={styles.unit}>per {product.unit}</span> : null}
          </div>
          <span className={styles.cta}>Open</span>
        </div>
      </div>
    </article>
  )
}
