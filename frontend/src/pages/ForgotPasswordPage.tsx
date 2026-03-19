import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AuthPage.module.scss'

type RequestStatus = 'idle' | 'loading' | 'success' | 'failed'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Укажите email')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      await authService.requestPasswordReset(email.trim())
      setStatus('success')
      setMessage('Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса пароля.')
    } catch (requestError) {
      setStatus('failed')
      setError(getErrorMessage(requestError, 'Не удалось запросить сброс пароля'))
    }
  }

  return (
    <div className={`${styles.page} ${styles.pageCompact}`}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="badge-pill">Пароль</span>
          <h1>Забыли пароль?</h1>
          <p>Введите email, и мы отправим ссылку для безопасного восстановления доступа.</p>
        </div>

        {message ? <div className={styles.notice}>{message}</div> : null}
        {error ? <ErrorMessage message={error} /> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              required
            />
          </label>
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Отправляем...' : 'Отправить ссылку'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login">Вернуться ко входу</Link>
          <span>
            Нужно подтверждение почты? <Link to="/verify-email">Открыть страницу подтверждения</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
