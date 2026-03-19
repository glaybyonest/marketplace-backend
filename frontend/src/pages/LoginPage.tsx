import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { authService } from '@/services/authService'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearAuthFeedback, loginThunk, loginWithEmailCodeThunk, loginWithPhoneCodeThunk } from '@/store/slices/authSlice'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/AuthPage.module.scss'

type LoginMode = 'password' | 'email_code' | 'phone_code'
type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface LocationState {
  from?: string
  message?: string
}

const modeMeta: Record<LoginMode, { label: string; title: string; description: string }> = {
  password: {
    label: 'Пароль',
    title: 'Вход по email и паролю',
    description: 'Основной сценарий: введите email и пароль, чтобы сразу попасть в аккаунт.',
  },
  email_code: {
    label: 'Код на email',
    title: 'Вход по коду из письма',
    description: 'Мы отправим одноразовый код на почту, и им можно будет войти без пароля.',
  },
  phone_code: {
    label: 'Код на телефон',
    title: 'Вход по коду на телефон',
    description: 'Используйте номер, привязанный к аккаунту. Код придёт через backend SMS flow.',
  },
}

const buildCodeMessage = (maskedDestination?: string, expiresIn?: number) => {
  const destinationPart = maskedDestination ? ` на ${maskedDestination}` : ''
  const expiresPart = expiresIn ? ` Код действует примерно ${Math.max(1, Math.round(expiresIn / 60))} мин.` : ''
  return `Мы отправили код${destinationPart}.${expiresPart}`
}

export const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const authState = useAppSelector((state) => state.auth)

  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle')
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const locationState = (location.state as LocationState | null) ?? null
  const from = locationState?.from ?? '/'
  const pageMessage = locationState?.message ?? authState.notice
  const verificationLink = useMemo(() => {
    const value = email.trim()
    return value.length > 0 ? `/verify-email?email=${encodeURIComponent(value)}` : '/verify-email'
  }, [email])

  useEffect(() => {
    return () => {
      dispatch(clearAuthFeedback())
    }
  }, [dispatch])

  const resetCodeState = () => {
    setRequestStatus('idle')
    setRequestMessage(null)
    setRequestError(null)
    setDevCode(null)
    setCode('')
  }

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    resetCodeState()
    dispatch(clearAuthFeedback())
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await dispatch(loginThunk({ email: email.trim(), password }))
    if (loginThunk.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  const handleCodeRequest = async () => {
    setRequestStatus('loading')
    setRequestMessage(null)
    setRequestError(null)
    setDevCode(null)
    dispatch(clearAuthFeedback())

    try {
      if (mode === 'email_code') {
        if (!email.trim()) {
          setRequestStatus('failed')
          setRequestError('Укажите email')
          return
        }

        const response = await authService.requestEmailLoginCode(email.trim())
        setRequestStatus('succeeded')
        setRequestMessage(buildCodeMessage(response.maskedDestination, response.expiresIn))
        setDevCode(response.devCode ?? null)
        if (response.devCode) {
          setCode(response.devCode)
        }
        return
      }

      if (!phone.trim()) {
        setRequestStatus('failed')
        setRequestError('Укажите номер телефона')
        return
      }

      const response = await authService.requestPhoneLoginCode(phone.trim())
      setRequestStatus('succeeded')
      setRequestMessage(buildCodeMessage(response.maskedDestination, response.expiresIn))
      setDevCode(response.devCode ?? null)
      if (response.devCode) {
        setCode(response.devCode)
      }
    } catch (error) {
      setRequestStatus('failed')
      setRequestError(getErrorMessage(error, 'Не удалось отправить код'))
    }
  }

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setRequestError('Введите код')
      return
    }

    const result =
      mode === 'email_code'
        ? await dispatch(loginWithEmailCodeThunk({ email: email.trim(), code: trimmedCode }))
        : await dispatch(loginWithPhoneCodeThunk({ phone: phone.trim(), code: trimmedCode }))

    if (loginWithEmailCodeThunk.fulfilled.match(result) || loginWithPhoneCodeThunk.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.showcase}>
        <div>
          <span className={styles.showcaseBadge}>Marketplace ID</span>
          <h2 className={styles.showcaseTitle}>Один экран входа для пароля, email-кода и телефона</h2>
          <p className={styles.showcaseText}>
            Пароль остаётся основным способом входа, но пользователь может переключиться на одноразовый код по почте или по
            телефону без отдельной страницы и лишних шагов.
          </p>
        </div>

        <div className={styles.showcaseList}>
          <div>
            <strong>Пароль как основной путь</strong>
            <p>Классический email + пароль остаётся на месте и никуда не исчезает.</p>
          </div>
          <div>
            <strong>Два запасных сценария</strong>
            <p>Если пароль неудобен, можно запросить код на email или на привязанный номер телефона.</p>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="badge-pill">Вход</span>
          <h1>Войдите в аккаунт</h1>
          <p>{modeMeta[mode].description}</p>
        </div>

        <div className={styles.modeSwitch}>
          {(Object.keys(modeMeta) as LoginMode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.modeButton} ${mode === item ? styles.modeButtonActive : ''}`}
              onClick={() => switchMode(item)}
            >
              {modeMeta[item].label}
            </button>
          ))}
        </div>

        {pageMessage ? <div className={styles.notice}>{pageMessage}</div> : null}
        {requestMessage ? <div className={styles.success}>{requestMessage}</div> : null}
        {devCode ? <p className={styles.inlineInfo}>Dev-код уже подставлен в поле ниже: {devCode}</p> : null}
        {requestError ? <ErrorMessage message={requestError} /> : null}
        {authState.error ? <ErrorMessage message={authState.error} /> : null}

        {authState.errorCode === 'email_not_verified' ? (
          <p className={styles.inlineInfo}>
            Почта ещё не подтверждена. <Link to={verificationLink}>Отправить письмо повторно</Link>
          </p>
        ) : null}

        {mode === 'password' ? (
          <form className={styles.form} onSubmit={handlePasswordSubmit}>
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
              Пароль
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" disabled={authState.status === 'loading'}>
              {authState.status === 'loading' ? 'Входим...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleCodeSubmit}>
            <label>
              {mode === 'email_code' ? 'Email' : 'Телефон'}
              <input
                type={mode === 'email_code' ? 'email' : 'tel'}
                value={mode === 'email_code' ? email : phone}
                onChange={(event) => {
                  if (mode === 'email_code') {
                    setEmail(event.target.value)
                  } else {
                    setPhone(event.target.value)
                  }
                }}
                placeholder={mode === 'email_code' ? 'you@example.com' : '+7 999 123-45-67'}
                autoComplete={mode === 'email_code' ? 'email' : 'tel'}
                maxLength={mode === 'email_code' ? 254 : 32}
                required
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCodeRequest}
                disabled={requestStatus === 'loading'}
              >
                {requestStatus === 'loading' ? 'Отправляем...' : 'Получить код'}
              </button>
            </div>

            <label>
              Код входа
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>

            <button type="submit" disabled={authState.status === 'loading'}>
              {authState.status === 'loading' ? 'Проверяем код...' : 'Войти по коду'}
            </button>
          </form>
        )}

        <div className={styles.links}>
          <Link to="/forgot-password">Не помню пароль</Link>
          <span>
            Нет аккаунта? <Link to="/register">Создать аккаунт</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
