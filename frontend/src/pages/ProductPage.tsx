import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addCartItemThunk } from '@/store/slices/cartSlice'
import { addFavoriteThunk, removeFavoriteThunk } from '@/store/slices/favoritesSlice'
import { fetchProductByIdThunk } from '@/store/slices/productsSlice'
import { fetchRecommendationsThunk } from '@/store/slices/recommendationsSlice'
import { formatCurrency } from '@/utils/format'

import styles from '@/pages/ProductPage.module.scss'

const FALLBACK_IMAGE = 'https://placehold.co/1200x900/f3f4f6/6b7280?text=No+Image'

const formatSpecLabel = (key: string) => key.replaceAll('_', ' ')

const formatSpecValue = (value: string | number | boolean | null) => {
  if (value === null) {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

export const ProductPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const auth = useAppSelector((state) => state.auth)
  const product = useAppSelector((state) => state.products.selectedProduct)
  const detailStatus = useAppSelector((state) => state.products.detailStatus)
  const productError = useAppSelector((state) => state.products.error)
  const favoriteItems = useAppSelector((state) => state.favorites.items)
  const favoriteMutationStatus = useAppSelector((state) => state.favorites.mutationStatus)
  const cartMutationStatus = useAppSelector((state) => state.cart.mutationStatus)
  const recommendations = useAppSelector((state) => state.recommendations.items)

  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!id) {
      return
    }
    dispatch(fetchProductByIdThunk(id))
  }, [dispatch, id])

  useEffect(() => {
    if (auth.isAuthenticated) {
      dispatch(fetchRecommendationsThunk(8))
    }
  }, [auth.isAuthenticated, dispatch])

  const isFavorite = useMemo(
    () => favoriteItems.some((item) => item.id === id),
    [favoriteItems, id],
  )

  const gallery = product?.images.length ? product.images : [FALLBACK_IMAGE]
  const selectedImage = product ? selectedImages[product.id] ?? '' : ''
  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0]
  const quantity = product ? quantities[product.id] ?? 1 : 1
  const safeQuantity = Math.min(quantity, Math.max(product?.stock || 1, 1))
  const specEntries = Object.entries(product?.specs ?? {})

  const handleToggleFavorite = async () => {
    if (!product) {
      return
    }

    if (!auth.isAuthenticated) {
      navigate('/login')
      return
    }

    if (isFavorite) {
      await dispatch(removeFavoriteThunk(product.id))
    } else {
      await dispatch(addFavoriteThunk(product.id))
    }
  }

  const handleAddToCart = async () => {
    if (!product) {
      return
    }

    if (!auth.isAuthenticated) {
      navigate('/login')
      return
    }

    await dispatch(addCartItemThunk({ productId: product.id, quantity: safeQuantity }))
    navigate('/cart')
  }

  if (detailStatus === 'loading') {
    return <AppLoader label="Loading product..." />
  }

  if (productError) {
    return <ErrorMessage message={productError} />
  }

  if (!product) {
    return <ErrorMessage message="Product not found" />
  }

  return (
    <div className={styles.page}>
      <section className={styles.product}>
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            <img src={activeImage} alt={product.title} className={styles.mainImage} />
          </div>
          <div className={styles.thumbs}>
            {gallery.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={image === activeImage ? styles.thumbActive : styles.thumb}
                onClick={() =>
                  setSelectedImages((current) => ({
                    ...current,
                    [product.id]: image,
                  }))
                }
              >
                <img src={image} alt={`${product.title} view ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.header}>
            <div className={styles.badges}>
              {product.categoryName ? <span className={styles.badge}>{product.categoryName}</span> : null}
              {product.brand ? <span className={styles.badgeAlt}>{product.brand}</span> : null}
            </div>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.subtitle}>
              SKU: {product.sku || product.id.slice(0, 8)}
              {product.unit ? ` | Sold per ${product.unit}` : ''}
            </p>
          </div>

          <div className={styles.priceBlock}>
            <p className={styles.price}>{formatCurrency(product.price, product.currency)}</p>
            {product.unit ? <span className={styles.unit}>per {product.unit}</span> : null}
          </div>

          <p className={styles.description}>{product.description || 'No description provided for this product yet.'}</p>

          <div className={`${styles.stock} ${product.stock && product.stock > 0 ? styles.inStock : styles.outOfStock}`}>
            <span>{product.stock && product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}</span>
          </div>

          <div className={styles.metaGrid}>
            {product.brand ? (
              <div className={styles.metaCard}>
                <span>Brand</span>
                <strong>{product.brand}</strong>
              </div>
            ) : null}
            {product.unit ? (
              <div className={styles.metaCard}>
                <span>Unit</span>
                <strong>{product.unit}</strong>
              </div>
            ) : null}
            <div className={styles.metaCard}>
              <span>SKU</span>
              <strong>{product.sku || product.id.slice(0, 8)}</strong>
            </div>
            {product.categoryName ? (
              <div className={styles.metaCard}>
                <span>Category</span>
                <strong>{product.categoryName}</strong>
              </div>
            ) : null}
          </div>

          {specEntries.length > 0 ? (
            <section className={styles.specs}>
              <h2>Specifications</h2>
              <dl className={styles.specList}>
                {specEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt>{formatSpecLabel(key)}</dt>
                    <dd>{formatSpecValue(value as string | number | boolean | null)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <div className={styles.quantity}>
            <span className={styles.quantityLabel}>Quantity</span>
            <div className={styles.quantityControls}>
              <button
                type="button"
                onClick={() =>
                  setQuantities((current) => ({
                    ...current,
                    [product.id]: Math.max(1, safeQuantity - 1),
                  }))
                }
                disabled={safeQuantity <= 1}
              >
                -
              </button>
              <span>{safeQuantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantities((current) => ({
                    ...current,
                    [product.id]: Math.min(product.stock || 1, safeQuantity + 1),
                  }))
                }
                disabled={!product.stock || safeQuantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.actionGroup}>
            <button
              type="button"
              className={`${styles.cartButton} ${!product.stock ? styles.cartButtonDisabled : ''}`}
              onClick={handleAddToCart}
              disabled={!product.stock || cartMutationStatus === 'loading'}
            >
              {cartMutationStatus === 'loading' ? 'Adding...' : 'Add to cart'}
            </button>

            <button
              type="button"
              className={styles.favoriteButton}
              onClick={handleToggleFavorite}
              disabled={favoriteMutationStatus === 'loading'}
            >
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </button>
          </div>
        </div>
      </section>

      {auth.isAuthenticated && recommendations.length > 0 ? (
        <section className={styles.recommendations}>
          <div className={styles.recommendationsHeader}>
            <h2>Recommended for you</h2>
            <p>Products from related categories and your recent activity.</p>
          </div>
          <div className={styles.recommendationList}>
            {recommendations
              .filter((item) => item.id !== product.id)
              .slice(0, 6)
              .map((item) => (
                <article key={item.id} className={styles.recommendationCard}>
                  <img src={item.imageUrl ?? item.images[0] ?? FALLBACK_IMAGE} alt={item.title} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.brand || item.categoryName || 'Catalog item'}</p>
                    <strong>{formatCurrency(item.price, item.currency)}</strong>
                  </div>
                  <Link to={`/products/${item.id}`}>Open</Link>
                </article>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
