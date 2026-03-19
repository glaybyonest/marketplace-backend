import { Link } from 'react-router-dom'

import styles from '@/pages/NotFoundPage.module.scss'

export const NotFoundPage = () => (
  <div className={styles.page}>
    <div className={styles.card}>
      <span className="badge-pill">404</span>
      <h1>Страница не найдена</h1>
      <p>Возможно, ссылка устарела или страница была перемещена после редизайна витрины.</p>
      <Link to="/" className="action-primary">
        Вернуться на главную
      </Link>
    </div>
  </div>
)
