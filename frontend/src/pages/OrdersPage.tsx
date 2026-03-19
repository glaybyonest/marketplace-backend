import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchOrdersThunk } from '@/store/slices/ordersSlice'
import { formatCurrency, formatDate } from '@/utils/format'

import styles from '@/pages/OrdersPage.module.scss'

const statusLabels: Record<string, string> = {
  pending: 'Оформлен',
  cancelled: 'Отменён',
}

interface LocationState {
  message?: string
}

export const OrdersPage = () => {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const { items, status, error } = useAppSelector((state) => state.orders)
  const pageMessage = ((location.state as LocationState | null) ?? null)?.message ?? null
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(fetchOrdersThunk({ page: 1, limit: 20 }))
  }, [dispatch])

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="badge-pill">Заказы</span>
          <h1>История покупок</h1>
        </div>
      </header>

      {pageMessage ? <div className={styles.notice}>{pageMessage}</div> : null}
      {status === 'loading' ? <AppLoader label="Загружаем заказы..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {items.length === 0 ? (
        <section className={`${styles.empty} empty-state`}>
          <h2>Заказов пока нет</h2>
          <p>После первого оформления здесь появятся товары, сумма заказа и адрес получения.</p>
        </section>
      ) : (
        <section className={styles.list}>
          {items.map((order) => {
            const isExpanded = Boolean(expandedOrders[order.id])

            return (
              <article key={order.id} className={styles.card}>
                <div className={styles.topRow}>
                  <div className={styles.orderHead}>
                    <h2>Заказ #{order.id.slice(0, 8)}</h2>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>

                  <div className={styles.topActions}>
                    <span className={styles.status}>{statusLabels[order.status] ?? order.status}</span>
                    <button
                      type="button"
                      className={styles.toggleButton}
                      onClick={() => toggleOrder(order.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Скрыть детали' : 'Подробнее'}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className={styles.details}>
                    <div className={styles.place}>
                      <strong>{order.placeTitle}</strong>
                      <p>{order.addressText}</p>
                    </div>

                    <ul className={styles.items}>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span>
                            {item.title} x {item.quantity}
                            {item.sellerName ? ` | ${item.sellerName}` : ''}
                          </span>
                          <strong>{formatCurrency(item.lineTotal, item.currency ?? order.currency)}</strong>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.totalRow}>
                      <span>Итого</span>
                      <strong>{formatCurrency(order.total, order.currency)}</strong>
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
