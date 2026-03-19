import { NavLink } from 'react-router-dom'

import styles from '@/components/seller/SellerNav.module.scss'

const items = [
  { to: '/seller', label: 'Главная', end: true },
  { to: '/seller/products', label: 'Товары' },
  { to: '/seller/storefront', label: 'Магазин' },
  { to: '/seller/orders', label: 'Заказы' },
]

export const SellerNav = () => (
  <nav className={styles.nav} aria-label="Разделы кабинета продавца">
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      >
        {item.label}
      </NavLink>
    ))}
  </nav>
)
