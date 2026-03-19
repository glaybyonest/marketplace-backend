import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AdminNav } from '@/components/admin/AdminNav'
import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { categoryService } from '@/services/categoryService'
import { productService } from '@/services/productService'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AdminPage.module.scss'

interface AdminDashboardState {
  categoriesTotal: number
  productsTotal: number
  activeProducts: number
  hiddenProducts: number
}

export const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminDashboardState>({
    categoriesTotal: 0,
    productsTotal: 0,
    activeProducts: 0,
    hiddenProducts: 0,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [categories, productsAll, productsActive, productsHidden] = await Promise.all([
          categoryService.getCategories(),
          productService.getAdminProducts({ page: 1, limit: 1 }),
          productService.getAdminProducts({ page: 1, limit: 1, is_active: true }),
          productService.getAdminProducts({ page: 1, limit: 1, is_active: false }),
        ])

        setStats({
          categoriesTotal: categories.length,
          productsTotal: productsAll.total,
          activeProducts: productsActive.total,
          hiddenProducts: productsHidden.total,
        })
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить сводку админки'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className="badge-pill">Backoffice</span>
          <h1>Управление каталогом и витриной</h1>
          <p>Здесь вы поддерживаете дерево категорий, карточки товаров, остатки и видимость товаров для публичной витрины.</p>
        </div>
        <AdminNav />
      </section>

      {loading ? <AppLoader label="Загружаем сводку админки..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {!loading && !error ? (
        <>
          <section className={styles.statsGrid}>
            <article>
              <h2>Категории</h2>
              <p className={styles.statsValue}>{stats.categoriesTotal}</p>
            </article>
            <article>
              <h2>Все товары</h2>
              <p className={styles.statsValue}>{stats.productsTotal}</p>
            </article>
            <article>
              <h2>Активные</h2>
              <p className={styles.statsValue}>{stats.activeProducts}</p>
            </article>
            <article>
              <h2>Скрытые</h2>
              <p className={styles.statsValue}>{stats.hiddenProducts}</p>
            </article>
          </section>

          <section className={styles.contentGrid}>
            <article className={styles.panel}>
              <h2>Категории и навигация</h2>
              <p>Поддерживайте структуру дерева, slug-и и родительские связи, чтобы каталог и поиск оставались предсказуемыми.</p>
              <div className={styles.formActions}>
                <Link to="/admin/categories" className={styles.primaryButton}>
                  Открыть категории
                </Link>
              </div>
            </article>

            <article className={styles.panel}>
              <h2>Карточки товаров и остатки</h2>
              <p>Обновляйте описания, медиа, характеристики, цены, наличие и видимость товаров на витрине.</p>
              <div className={styles.formActions}>
                <Link to="/admin/products" className={styles.primaryButton}>
                  Открыть товары
                </Link>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}
