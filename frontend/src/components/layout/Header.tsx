import { useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutThunk } from '@/store/slices/authSlice'

import styles from '@/components/layout/Header.module.scss'

interface NavItem {
  to: string
  label: string
}

const publicItems: NavItem[] = [
  { to: '/', label: 'Catalog' },
]

const privateItems: NavItem[] = [
  { to: '/favorites', label: 'Favorites' },
  { to: '/account', label: 'Account' },
  { to: '/account/places', label: 'Places' },
]

export const Header = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const auth = useAppSelector((state) => state.auth)

  const navItems = useMemo(() => {
    return auth.isAuthenticated ? [...publicItems, ...privateItems] : publicItems
  }, [auth.isAuthenticated])

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          Marketplace
        </Link>

        <button
          type="button"
          className={styles.mobileToggle}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          aria-label="Main menu"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          {auth.isAuthenticated ? (
            <button type="button" className={styles.authButton} onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={styles.authButton}>
                Login
              </Link>
              <Link to="/register" className={styles.authButtonSecondary}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
