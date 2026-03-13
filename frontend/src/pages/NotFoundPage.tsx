import { Link } from 'react-router-dom'

import styles from '@/pages/NotFoundPage.module.scss'

export const NotFoundPage = () => (
  <div className={styles.page}>
    <h1>404</h1>
    <p>Страница не найдена.</p>
    <Link to="/">Вернуться в каталог</Link>
  </div>
)
