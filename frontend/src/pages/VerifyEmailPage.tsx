import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AuthPage.module.scss'

type RequestStatus = 'idle' | 'loading' | 'success' | 'failed'

interface LocationState {
  message?: string
}

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const initialEmail = searchParams.get('email')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const locationState = (location.state as LocationState | null) ?? null

  const [email, setEmail] = useState(initialEmail)
  const [confirmStatus, setConfirmStatus] = useState<RequestStatus>(token ? 'loading' : 'idle')
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(locationState?.message ?? null)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    authService
      .confirmEmailVerification(token)
      .then(() => {
        if (cancelled) {
          return
        }
        setConfirmStatus('success')
        setMessage('Email подтверждён. Теперь можно войти в аккаунт.')
      })
      .catch((requestError: unknown) => {
        if (cancelled) {
          return
        }
        setConfirmStatus('failed')
        setError(getErrorMessage(requestError, 'Не удалось подтвердить email'))
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Укажите email')
      return
    }

    setRequestStatus('loading')
    setError(null)

    try {
      await authService.requestEmailVerification(email.trim())
      setRequestStatus('success')
      setMessage('Если для этого email есть неподтверждённый аккаунт, мы отправили новое письмо.')
    } catch (requestError) {
      setRequestStatus('failed')
      setError(getErrorMessage(requestError, 'Не удалось отправить письмо с подтверждением'))
    }
  }

  return (
    <div className={`${styles.page} ${styles.pageCompact}`}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="badge-pill">Email</span>
          <h1>Подтвердите почту</h1>
          <p>Это нужно для безопасного входа, восстановления доступа и работы с аккаунтом.</p>
        </div>

        {confirmStatus === 'loading' ? <AppLoader label="Проверяем ссылку..." /> : null}
        {message ? <div className={confirmStatus === 'success' ? styles.success : styles.notice}>{message}</div> : null}
        {error ? <ErrorMessage message={error} /> : null}

        {confirmStatus === 'success' ? (
          <div className={styles.actions}>
            <Link to="/login">Перейти ко входу</Link>
          </div>
        ) : null}

        {confirmStatus !== 'loading' && confirmStatus !== 'success' ? (
          <>
            <form className={styles.form} onSubmit={handleResend}>
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
              <button type="submit" disabled={requestStatus === 'loading'}>
                {requestStatus === 'loading' ? 'Отправляем...' : 'Отправить письмо повторно'}
              </button>
            </form>

            <div className={styles.links}>
              <Link to="/login">Вернуться ко входу</Link>
              <span>
                Нужен новый аккаунт? <Link to="/register">Зарегистрироваться</Link>
              </span>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}
