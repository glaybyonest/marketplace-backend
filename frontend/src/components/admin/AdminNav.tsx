import { NavLink } from 'react-router-dom'

import styles from '@/components/admin/AdminNav.module.scss'

const items = [
  { to: '/admin', label: 'Обзор', end: true },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/products', label: 'Товары' },
]

export const AdminNav = () => (
  <nav className={styles.nav} aria-label="Разделы админки">
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
