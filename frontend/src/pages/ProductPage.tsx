import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ProductCard } from '@/components/catalog/ProductCard'
import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { productService } from '@/services/productService'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addCartItemThunk } from '@/store/slices/cartSlice'
import { addFavoriteThunk, removeFavoriteThunk } from '@/store/slices/favoritesSlice'
import { fetchPlacesThunk } from '@/store/slices/placesSlice'
import { fetchProductThunk } from '@/store/slices/productsSlice'
import type { Product } from '@/types/domain'
import { formatCurrency } from '@/utils/format'

import styles from '@/pages/ProductPage.module.scss'

const FALLBACK_IMAGE = 'https://placehold.co/1200x900/f3f4f6/6b7280?text=No+Image'

const formatSpecLabel = (key: string) =>
  key
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatSpecValue = (value: string | number | boolean | null) => {
  if (value === null) {
    return 'Не указано'
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }
  return String(value)
}

export const ProductPage = () => {
  const { productRef = '' } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const auth = useAppSelector((state) => state.auth)
  const product = useAppSelector((state) => state.products.selectedProduct)
  const detailStatus = useAppSelector((state) => state.products.detailStatus)
  const productError = useAppSelector((state) => state.products.error)
  const favoriteItems = useAppSelector((state) => state.favorites.items)
  const favoriteMutationStatus = useAppSelector((state) => state.favorites.mutationStatus)
  const cartMutationStatus = useAppSelector((state) => state.cart.mutationStatus)
  const places = useAppSelector((state) => state.places.items)
  const placesStatus = useAppSelector((state) => state.places.status)

  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [relatedItems, setRelatedItems] = useState<Product[]>([])
  const [relatedStatus, setRelatedStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle')

  useEffect(() => {
    if (!productRef) {
      return
    }
    dispatch(fetchProductThunk(productRef))
  }, [dispatch, productRef])

  useEffect(() => {
    if (!auth.isAuthenticated || placesStatus !== 'idle') {
      return
    }
    dispatch(fetchPlacesThunk())
  }, [auth.isAuthenticated, dispatch, placesStatus])

  useEffect(() => {
    let cancelled = false
    const loadRelatedItems = async () => {
      if (!product?.categoryId) {
        if (!cancelled) {
          setRelatedItems([])
          setRelatedStatus('idle')
        }
        return
      }

      setRelatedStatus('loading')

      try {
        const response = await productService.getProducts({
          page: 1,
          limit: 8,
          category_id: product.categoryId,
        })

        if (cancelled) {
          return
        }

        setRelatedItems(response.items.filter((item) => item.id !== product.id).slice(0, 6))
        setRelatedStatus('succeeded')
      } catch {
        if (cancelled) {
          return
        }

        setRelatedItems([])
        setRelatedStatus('failed')
      }
    }

    void loadRelatedItems()

    return () => {
      cancelled = true
    }
  }, [product?.categoryId, product?.id])

  const isFavorite = useMemo(
    () => (product ? favoriteItems.some((item) => item.id === product.id) : false),
    [favoriteItems, product],
  )

  const gallery = product?.images.length ? product.images : [product?.imageUrl ?? FALLBACK_IMAGE]
  const selectedImage = product ? selectedImages[product.id] ?? '' : ''
  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0]
  const quantity = product ? quantities[product.id] ?? 1 : 1
  const safeQuantity = Math.min(quantity, Math.max(product?.stock || 1, 1))
  const specEntries = Object.entries(product?.specs ?? {})
  const oldPrice = product ? Math.round(product.price * 1.14) : 0
  const savings = product ? oldPrice - product.price : 0
  const isAvailable = Boolean(product?.stock && product.stock > 0)
  const deliveryPlace = places[0]

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
      return
    }

    await dispatch(addFavoriteThunk(product.id))
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
    return <AppLoader label="Загружаем карточку товара..." />
  }

  if (productError) {
    return <ErrorMessage message={productError} />
  }

  if (!product) {
    return <ErrorMessage message="Товар не найден" />
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to={product.categoryId ? `/?category_id=${product.categoryId}` : '/'}>{product.categoryName ?? 'Каталог'}</Link>
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      <section className={styles.layout}>
        <div className={`${styles.galleryPanel} page-card`}>
          <div className={styles.galleryRail}>
            <div className={styles.thumbList}>
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
                  <img src={image} alt={`${product.title} ${index + 1}`} />
                </button>
              ))}
            </div>

            <div className={styles.mainStage}>
              <div className={styles.visualBadges}>
                {product.categoryName ? <span className="badge-pill">{product.categoryName}</span> : null}
                {savings > 0 ? <span className={`${styles.discountBadge} badge-pill`}>Экономия {formatCurrency(savings, product.currency)}</span> : null}
              </div>
              <img src={activeImage} alt={product.title} className={styles.mainImage} />
            </div>
          </div>
        </div>

        <div className={styles.infoColumn}>
          <section className={`${styles.infoPanel} page-card`}>
            <div className={styles.badges}>
              {product.brand ? <span className={styles.badgeAlt}>{product.brand}</span> : null}
              <span className={styles.badge}>Артикул {product.sku || product.id.slice(0, 8)}</span>
              {product.unit ? <span className={styles.badge}>Продажа по {product.unit}</span> : null}
            </div>

            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.metaRow}>
              <span>Рейтинг {product.rating ? product.rating.toFixed(1) : '4.8'} / 5</span>
              <span>{product.categoryName ?? 'Категория каталога'}</span>
              <span>{isAvailable ? `В наличии: ${product.stock}` : 'Под заказ'}</span>
            </div>

            <div className={styles.priceRow}>
              <strong className={styles.currentPrice}>{formatCurrency(product.price, product.currency)}</strong>
              {savings > 0 ? <span className={styles.oldPrice}>{formatCurrency(oldPrice, product.currency)}</span> : null}
              {product.unit ? <span className={styles.unit}>за {product.unit}</span> : null}
            </div>

            <div className={isAvailable ? styles.stockChipActive : styles.stockChip}>
              {isAvailable ? 'Можно оформить доставку или самовывоз' : 'Сейчас недоступен для быстрой покупки'}
            </div>

            <p className={styles.description}>
              {product.description || 'Описание пока не добавлено. Откройте характеристики и детали поставки ниже.'}
            </p>

            <div className={styles.statsGrid}>
              <article className={styles.statCard}>
                <span>Бренд</span>
                <strong>{product.brand || 'Marketplace Collection'}</strong>
              </article>
              <article className={styles.statCard}>
                <span>Категория</span>
                <strong>{product.categoryName || 'Каталог'}</strong>
              </article>
              <article className={styles.statCard}>
                <span>SKU</span>
                <strong>{product.sku || product.id.slice(0, 8)}</strong>
              </article>
              <article className={styles.statCard}>
                <span>Формат продажи</span>
                <strong>{product.unit || 'шт.'}</strong>
              </article>
            </div>
          </section>

          <section className={`${styles.sectionCard} page-card`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className="badge-pill">Доставка</span>
                <h2>Условия получения</h2>
              </div>
            </div>
            <div className={styles.deliveryGrid}>
              <article className={styles.deliveryCard}>
                <strong>Курьером или в пункт выдачи</strong>
                <p>
                  {deliveryPlace
                    ? `${deliveryPlace.title}: ${deliveryPlace.addressText}`
                    : 'Выберите адрес в профиле, чтобы увидеть персональный сценарий доставки.'}
                </p>
              </article>
              <article className={styles.deliveryCard}>
                <strong>Оплата и оформление</strong>
                <p>Все действия идут через ваш текущий backend checkout без изменения API-контрактов.</p>
              </article>
            </div>
          </section>

          {specEntries.length > 0 ? (
            <section className={`${styles.sectionCard} page-card`}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className="badge-pill">Характеристики</span>
                  <h2>Что важно знать перед заказом</h2>
                </div>
              </div>
              <dl className={styles.specList}>
                {specEntries.map(([key, value]) => (
                  <div key={key} className={styles.specRow}>
                    <dt>{formatSpecLabel(key)}</dt>
                    <dd>{formatSpecValue(value as string | number | boolean | null)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        <aside className={`${styles.purchasePanel} summary-card`}>
          <div className={styles.purchaseTop}>
            <span className="badge-pill">К покупке</span>
            <strong className={styles.sidebarPrice}>{formatCurrency(product.price, product.currency)}</strong>
            {savings > 0 ? <span className={styles.sidebarOldPrice}>{formatCurrency(oldPrice, product.currency)}</span> : null}
          </div>

          <div className={styles.quantityCard}>
            <span>Количество</span>
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

          <button
            type="button"
            className="action-primary"
            onClick={handleAddToCart}
            disabled={!product.stock || cartMutationStatus === 'loading'}
          >
            {cartMutationStatus === 'loading' ? 'Добавляем...' : 'Добавить в корзину'}
          </button>

          <button
            type="button"
            className="action-secondary"
            onClick={handleToggleFavorite}
            disabled={favoriteMutationStatus === 'loading'}
          >
            {isFavorite ? 'Убрать из избранного' : 'Сохранить в избранное'}
          </button>

          <div className={styles.purchaseMeta}>
            <div>
              <span>Адрес</span>
              <strong>{deliveryPlace?.title || 'Гостевой режим'}</strong>
            </div>
            <div>
              <span>Получение</span>
              <strong>{isAvailable ? 'Зависит от адреса' : 'После пополнения'}</strong>
            </div>
            <div>
              <span>Статус</span>
              <strong>{isAvailable ? 'Готов к оформлению' : 'Требуется ожидание'}</strong>
            </div>
          </div>
        </aside>
      </section>

      {relatedItems.length > 0 ? (
        <section className={styles.recommendationsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span className="badge-pill">Похожие товары</span>
              <h2>Часто смотрят вместе с этой карточкой</h2>
              <p>Подборка построена по текущей категории каталога.</p>
            </div>
          </div>
          <div className={styles.recommendationsGrid}>
            {relatedItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : relatedStatus === 'loading' ? (
        <section className={`${styles.recommendationsSection} page-card`}>
          <AppLoader label="Подбираем похожие товары..." />
        </section>
      ) : null}
    </div>
  )
}
