import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerThunk } from '@/store/slices/authSlice'

import styles from '@/pages/AuthPage.module.scss'

const PASSWORD_MIN_LEN = 8
const PASSWORD_MAX_LEN = 72

const hasLatinLetterAndDigit = (value: string) => /[A-Za-z]/.test(value) && /\d/.test(value)

const validateForm = (name: string, email: string, password: string, phone: string): string | null => {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim()
  const trimmedPhone = phone.trim()

  if (!trimmedName) {
    return 'Укажите имя'
  }

  if (trimmedName.length > 120) {
    return 'Имя должно быть короче 120 символов'
  }

  if (!trimmedEmail) {
    return 'Укажите email'
  }

  if (trimmedPhone.length > 0 && trimmedPhone.length < 10) {
    return 'Проверьте номер телефона'
  }

  if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN) {
    return 'Пароль должен содержать от 8 до 72 символов'
  }

  if (!hasLatinLetterAndDigit(password)) {
    return 'Пароль должен содержать хотя бы одну латинскую букву и одну цифру'
  }

  return null
}

export const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const authState = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm(name, email, password, phone)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)

    const normalizedEmail = email.trim()
    const result = await dispatch(
      registerThunk({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim() || undefined,
        password,
      }),
    )

    if (!registerThunk.fulfilled.match(result)) {
      return
    }

    if (result.payload.requiresEmailVerification) {
      navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, {
        replace: true,
        state: {
          message: result.payload.message ?? 'Мы отправили письмо с подтверждением на ваш email',
        },
      })
      return
    }

    navigate('/', { replace: true })
  }

  const shownError = localError ?? authState.error

  return (
    <div className={`${styles.page} ${styles.pageCompact}`}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="badge-pill">Регистрация</span>
          <h1>Создать аккаунт</h1>
          <p>Заполните данные, чтобы открыть личный кабинет, адреса, заказы и избранное.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} required />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>

          <label>
            Телефон
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 999 123-45-67"
              autoComplete="tel"
              maxLength={32}
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
              autoComplete="new-password"
              required
            />
          </label>

          <p className={styles.hint}>Телефон можно не заполнять, но он пригодится для быстрого входа по коду.</p>
          <p className={styles.hint}>Используйте от 8 до 72 символов, минимум одну латинскую букву и одну цифру.</p>

          {shownError ? <ErrorMessage message={shownError} /> : null}

          <button type="submit" disabled={authState.status === 'loading'}>
            {authState.status === 'loading' ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.links}>
          <span>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
