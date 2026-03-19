import { startTransition, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'

import { campaignBanner, categoryVisuals, heroSlides, promoTiles, storyCards } from '@/config/storefront'
import type { FilterValues } from '@/components/catalog/FilterPanel'
import { FilterPanel } from '@/components/catalog/FilterPanel'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { SearchBar } from '@/components/catalog/SearchBar'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { productService } from '@/services/productService'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCategoriesThunk } from '@/store/slices/categoriesSlice'
import { fetchProductsThunk } from '@/store/slices/productsSlice'
import { fetchRecommendationsThunk } from '@/store/slices/recommendationsSlice'
import { filtersToSearchParams, searchParamsToFilters } from '@/utils/query'

import styles from '@/pages/HomePage.module.scss'

export const HomePage = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [popularQueries, setPopularQueries] = useState<string[]>([])

  const auth = useAppSelector((state) => state.auth)
  const categories = useAppSelector((state) => state.categories.items)
  const productsState = useAppSelector((state) => state.products)
  const recommendations = useAppSelector((state) => state.recommendations.items)

  const filters = useMemo(() => searchParamsToFilters(searchParams), [searchParams])
  const hasActiveFilters = Boolean(
    filters.q || filters.category_id || filters.min_price || filters.max_price || filters.in_stock || (filters.sort && filters.sort !== 'new'),
  )

  useEffect(() => {
    dispatch(fetchCategoriesThunk())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchProductsThunk({ limit: 18, sort: 'new', ...filters }))
  }, [dispatch, filters])

  useEffect(() => {
    if (auth.isAuthenticated) {
      dispatch(fetchRecommendationsThunk(8))
    }
  }, [auth.isAuthenticated, dispatch])

  useEffect(() => {
    let cancelled = false

    productService
      .getPopularSearches(6)
      .then((items) => {
        if (!cancelled) {
          setPopularQueries(items.map((item) => item.query))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPopularQueries([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (hasActiveFilters) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [hasActiveFilters])

  const activeHero = heroSlides[activeSlide]

  const applyFilters = (values: FilterValues) => {
    const nextParams = filtersToSearchParams({
      ...filters,
      ...values,
      page: 1,
      limit: 18,
    })
    startTransition(() => setSearchParams(nextParams))
  }

  const handleSearch = (query: string) => {
    const nextParams = filtersToSearchParams({
      ...filters,
      q: query || undefined,
      page: 1,
      limit: 18,
    })
    startTransition(() => setSearchParams(nextParams))
  }

  const handleCategoryClick = (categoryId?: string) => {
    const nextParams = filtersToSearchParams({
      ...filters,
      category_id: categoryId,
      page: 1,
      limit: 18,
    })
    startTransition(() => setSearchParams(nextParams))
  }

  const handleReset = () => {
    startTransition(() => setSearchParams(new URLSearchParams()))
  }

  const currentPage = filters.page ?? 1
  const nextPage = Math.min(productsState.totalPages, currentPage + 1)
  const prevPage = Math.max(1, currentPage - 1)

  const renderPaginationButtons = () => {
    const buttons = []
    const totalPages = productsState.totalPages
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          type="button"
          className={`${styles.paginationBtn} ${i === currentPage ? styles.paginationBtnActive : ''}`}
          onClick={() => setSearchParams(filtersToSearchParams({ ...filters, page: i, limit: 18 }))}
        >
          {i}
        </button>,
      )
    }

    return buttons
  }

  const filterValues: FilterValues = {
    category_id: filters.category_id,
    min_price: filters.min_price,
    max_price: filters.max_price,
    in_stock: filters.in_stock,
    sort: (filters.sort as FilterValues['sort']) ?? 'new',
  }

  const shelves = useMemo(() => {
    const items = productsState.items
    return {
      fast: items.slice(0, 6),
      recommended: recommendations.slice(0, 6),
    }
  }, [productsState.items, recommendations])

  const selectedCategory = categories.find((category) => category.id === filters.category_id)
  const heroStyle = {
    '--tone-from': activeHero.toneFrom,
    '--tone-to': activeHero.toneTo,
    '--tone-accent': activeHero.accent,
  } as CSSProperties

  const openConfiguredLink = (categorySlug?: string, query?: string) => {
    const matchedCategory = categories.find((category) => category.slug === categorySlug)
    const nextParams = filtersToSearchParams({
      q: query || undefined,
      category_id: matchedCategory?.id,
      page: 1,
      limit: 18,
      sort: 'new',
    })
    startTransition(() => setSearchParams(nextParams))
  }

  return (
    <div className={styles.page}>
      {!hasActiveFilters ? (
        <>
          <section className={styles.heroLayout}>
            <article className={styles.heroCard} style={heroStyle}>
              <div className={styles.heroCopy}>
                <span className={styles.heroBadge}>{activeHero.badge}</span>
                <h1 className={styles.heroTitle}>{activeHero.title}</h1>
                <p className={styles.heroSub}>{activeHero.description}</p>
                <div className={styles.heroSearch}>
                  <SearchBar
                    initialValue={filters.q ?? ''}
                    onSearch={handleSearch}
                    variant="hero"
                    placeholder="Найти товар, категорию или бренд"
                    submitLabel="Искать"
                  />
                </div>
                <div className={styles.heroActions}>
                  <button type="button" className="action-primary" onClick={() => openConfiguredLink(activeHero.categorySlug, activeHero.query)}>
                    {activeHero.ctaLabel}
                  </button>
                  <span className={styles.heroStat}>{activeHero.stat}</span>
                </div>
                {popularQueries.length > 0 ? (
                  <div className={styles.heroChips}>
                    {popularQueries.map((query) => (
                      <button key={query} type="button" className={styles.heroChip} onClick={() => handleSearch(query)}>
                        {query}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.heroOrb} />
                <div className={styles.heroPanel}>
                  <span>Каталог</span>
                  <strong>Поиск и подборки</strong>
                </div>
                <div className={styles.heroPanelAlt}>
                  <span>Checkout</span>
                  <strong>Адреса, корзина, заказы</strong>
                </div>
              </div>
            </article>

            <aside className={styles.promoColumn}>
              {promoTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={styles.promoTile}
                  style={{ '--tone-from': tile.toneFrom, '--tone-to': tile.toneTo } as CSSProperties}
                  onClick={() => openConfiguredLink(tile.categorySlug, tile.query)}
                >
                  <div>
                    <strong>{tile.title}</strong>
                    <p>{tile.description}</p>
                  </div>
                  <span>{tile.ctaLabel}</span>
                </button>
              ))}
            </aside>
          </section>

          <section className={styles.storyStrip}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionKicker}>Витрина</span>
                <h2>Истории и сервисы</h2>
              </div>
            </div>

            <div className={styles.storyGrid}>
              {storyCards.map((story) => (
                <article
                  key={story.id}
                  className={styles.storyCard}
                  style={{ '--tone-from': story.toneFrom, '--tone-to': story.toneTo } as CSSProperties}
                >
                  <strong>{story.title}</strong>
                  <p>{story.subtitle}</p>
                  <span>{story.note}</span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.shelfSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionKicker}>Под рукой</span>
                <h2>Категории каталога</h2>
              </div>
              <button type="button" className="action-secondary" onClick={handleReset}>
                Весь каталог
              </button>
            </div>

            <div className={styles.categoriesGrid}>
              <button
                type="button"
                className={`${styles.categoryCard} ${!filters.category_id ? styles.categoryCardActive : ''}`}
                onClick={() => handleCategoryClick(undefined)}
              >
                <span className={styles.categoryIcon}>ВС</span>
                <span className={styles.categoryName}>Все товары</span>
              </button>
              {categories.map((category) => {
                const visual = categoryVisuals[category.slug ?? ''] ?? { icon: 'CT', accent: '#005bff' }
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`${styles.categoryCard} ${filters.category_id === category.id ? styles.categoryCardActive : ''}`}
                    style={{ '--category-accent': visual.accent } as CSSProperties}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <span className={styles.categoryIcon}>{visual.icon}</span>
                    <span className={styles.categoryName}>{category.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {shelves.fast.length > 0 ? (
            <section className={styles.shelfSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionKicker}>Полка</span>
                  <h2>Хиты недели</h2>
                </div>
                <p>Плотная карточная сетка как у крупного маркетплейса, но поверх вашего каталога.</p>
              </div>
              <ProductGrid products={shelves.fast} />
            </section>
          ) : null}

          {shelves.recommended.length > 0 ? (
            <section className={styles.shelfSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionKicker}>Персонально</span>
                  <h2>Рекомендуем вам</h2>
                </div>
              </div>
              <ProductGrid products={shelves.recommended} />
            </section>
          ) : null}

          <section className={styles.campaignBanner}>
            <div>
              <span className={styles.sectionKicker}>Без изменений API</span>
              <h2>{campaignBanner.title}</h2>
              <p>{campaignBanner.description}</p>
            </div>
            <button type="button" className="action-primary" onClick={handleReset}>
              Открыть каталог
            </button>
          </section>
        </>
      ) : null}

      <div className={styles.heading}>
        <div>
          <span className={styles.sectionKicker}>Каталог</span>
          <h2>{selectedCategory?.name ?? (filters.q ? `Результаты по запросу «${filters.q}»` : 'Все товары')}</h2>
          <p className={styles.sub}>Фильтры, сортировка, поиск и карточки товара используют существующий backend-контур.</p>
        </div>
        <button type="button" className="action-secondary" onClick={() => setMobileFiltersOpen(true)}>
          Фильтры
        </button>
      </div>

      <div className={styles.layout}>
        <aside className={styles.filters}>
          <FilterPanel
            categories={categories}
            values={filterValues}
            onChange={applyFilters}
            onReset={handleReset}
            mobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />
        </aside>

        <section className={styles.catalog}>
          {popularQueries.length > 0 ? (
            <div className={styles.popularStrip}>
              <span>Популярно:</span>
              <div className={styles.popularList}>
                {popularQueries.map((query) => (
                  <button key={query} type="button" className={styles.popularItem} onClick={() => handleSearch(query)}>
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {productsState.status === 'loading' ? (
            <div className={styles.loading}>
              <div className={styles.loader} />
            </div>
          ) : null}
          {productsState.error ? <ErrorMessage message={productsState.error} /> : null}
          <ProductGrid products={productsState.items} />

          {productsState.totalPages > 1 ? (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage <= 1}
                onClick={() => setSearchParams(filtersToSearchParams({ ...filters, page: prevPage, limit: 18 }))}
              >
                Назад
              </button>
              {renderPaginationButtons()}
              <span className={styles.paginationInfo}>
                {currentPage} / {productsState.totalPages}
              </span>
              <button
                type="button"
                className={styles.paginationBtn}
                disabled={currentPage >= productsState.totalPages}
                onClick={() => setSearchParams(filtersToSearchParams({ ...filters, page: nextPage, limit: 18 }))}
              >
                Дальше
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
