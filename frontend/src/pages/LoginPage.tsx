import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginThunk } from '@/store/slices/authSlice'

import styles from '@/pages/AuthPage.module.scss'

interface LocationState {
  from?: string
  message?: string
}

export const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const authState = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const locationState = (location.state as LocationState | null) ?? null
  const from = locationState?.from ?? '/'
  const pageMessage = locationState?.message ?? authState.notice
  const verificationLink =
    email.trim().length > 0 ? `/verify-email?email=${encodeURIComponent(email.trim())}` : '/verify-email'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await dispatch(loginThunk({ email: email.trim(), password }))
    if (loginThunk.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Sign in</h1>
        <p>Use your email and password to access your account.</p>

        {pageMessage ? <div className={styles.notice}>{pageMessage}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
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
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {authState.error ? <ErrorMessage message={authState.error} /> : null}

          {authState.errorCode === 'email_not_verified' ? (
            <p className={styles.inlineInfo}>
              Need a fresh verification link? <Link to={verificationLink}>Resend email</Link>
            </p>
          ) : null}

          <button type="submit" disabled={authState.status === 'loading'}>
            {authState.status === 'loading' ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            No account yet? <Link to="/register">Create one</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
