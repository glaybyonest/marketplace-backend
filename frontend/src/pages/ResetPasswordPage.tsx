import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AuthPage.module.scss'

const PASSWORD_MIN_LEN = 8
const PASSWORD_MAX_LEN = 72

const hasLatinLetterAndDigit = (value: string) => /[A-Za-z]/.test(value) && /\d/.test(value)

const validatePassword = (password: string, confirmPassword: string): string | null => {
  if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN) {
    return 'Пароль должен содержать от 8 до 72 символов'
  }

  if (!hasLatinLetterAndDigit(password)) {
    return 'Пароль должен содержать хотя бы одну латинскую букву и одну цифру'
  }

  if (password !== confirmPassword) {
    return 'Пароли не совпадают'
  }

  return null
}

type RequestStatus = 'idle' | 'loading' | 'success' | 'failed'

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setError('В ссылке отсутствует токен для сброса пароля')
      return
    }

    const validationError = validatePassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      await authService.confirmPasswordReset(token, password)
      setStatus('success')
      setMessage('Пароль обновлён. Теперь можно войти с новым паролем.')
    } catch (requestError) {
      setStatus('failed')
      setError(getErrorMessage(requestError, 'Не удалось обновить пароль'))
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.showcase}>
        <div>
          <span className={styles.showcaseBadge}>Новый пароль</span>
          <h2 className={styles.showcaseTitle}>Обновите пароль и сразу возвращайтесь к заказам</h2>
          <p className={styles.showcaseText}>
            После успешного сброса вы входите в тот же аккаунт с теми же заказами, адресами и избранным.
          </p>
        </div>

        <div className={styles.showcaseList}>
          <div>
            <strong>Защищённый токен</strong>
            <p>Страница работает только по ссылке из письма восстановления.</p>
          </div>
          <div>
            <strong>Те же backend-правила</strong>
            <p>Ограничения на пароль и валидация остаются совместимыми с вашим сервером.</p>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="badge-pill">Сброс</span>
          <h1>Задайте новый пароль</h1>
          <p>Введите новый пароль дважды, чтобы обновить доступ к аккаунту.</p>
        </div>

        {message ? <div className={styles.success}>{message}</div> : null}
        {error ? <ErrorMessage message={error} /> : null}

        {!token ? <div className={styles.inlineInfo}>Откройте эту страницу по ссылке из письма восстановления.</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Новый пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
              required
            />
          </label>
          <label>
            Повторите пароль
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
              required
            />
          </label>
          <p className={styles.hint}>Используйте от 8 до 72 символов, минимум одну латинскую букву и одну цифру.</p>
          <button type="submit" disabled={status === 'loading' || !token}>
            {status === 'loading' ? 'Сохраняем...' : 'Сохранить новый пароль'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login">Вернуться ко входу</Link>
          <span>
            Нужна новая ссылка? <Link to="/forgot-password">Запросить повторно</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
