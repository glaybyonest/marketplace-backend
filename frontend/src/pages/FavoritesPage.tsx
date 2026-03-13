import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchFavoritesThunk, removeFavoriteThunk } from '@/store/slices/favoritesSlice'
import { formatCurrency } from '@/utils/format'

import styles from '@/pages/FavoritesPage.module.scss'

export const FavoritesPage = () => {
  const dispatch = useAppDispatch()
  const { items, status, mutationStatus, error } = useAppSelector((state) => state.favorites)

  useEffect(() => {
    dispatch(fetchFavoritesThunk({ page: 1, limit: 50 }))
  }, [dispatch])

  const handleDelete = (productId: string) => {
    dispatch(removeFavoriteThunk(productId))
  }

  return (
    <div className={styles.page}>
      <h1>Favorites</h1>
      {status === 'loading' ? <AppLoader label="Loading favorites..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {items.length === 0 ? (
        <p>
          No favorites yet. <Link to="/">Browse catalog</Link>
        </p>
      ) : (
        <div className={styles.content}>
          <section className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.item}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{formatCurrency(item.price, item.currency)}</p>
                </div>
                <button type="button" onClick={() => handleDelete(item.id)} disabled={mutationStatus === 'loading'}>
                  Remove
                </button>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
