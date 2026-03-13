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
        setMessage('Your email has been verified. You can sign in now.')
      })
      .catch((requestError: unknown) => {
        if (cancelled) {
          return
        }
        setConfirmStatus('failed')
        setError(getErrorMessage(requestError, 'Failed to verify email'))
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter your email')
      return
    }

    setRequestStatus('loading')
    setError(null)

    try {
      await authService.requestEmailVerification(email.trim())
      setRequestStatus('success')
      setMessage('If an unverified account exists for this email, a new verification link has been sent.')
    } catch (requestError) {
      setRequestStatus('failed')
      setError(getErrorMessage(requestError, 'Failed to send verification email'))
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Verify email</h1>
        <p>Confirm your email address to activate sign-in and password reset flows.</p>

        {confirmStatus === 'loading' ? <AppLoader label="Verifying email..." /> : null}
        {message ? <div className={confirmStatus === 'success' ? styles.success : styles.notice}>{message}</div> : null}
        {error ? <ErrorMessage message={error} /> : null}

        {confirmStatus === 'success' ? (
          <div className={styles.actions}>
            <Link to="/login">Go to sign in</Link>
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
                {requestStatus === 'loading' ? 'Sending...' : 'Send verification email'}
              </button>
            </form>

            <div className={styles.links}>
              <Link to="/login">Back to sign in</Link>
              <span>
                Need a new account? <Link to="/register">Register</Link>
              </span>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}
