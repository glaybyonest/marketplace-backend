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
      setError('Enter your email')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      await authService.requestPasswordReset(email.trim())
      setStatus('success')
      setMessage('If this account exists, a password reset link has been sent to the email address.')
    } catch (requestError) {
      setStatus('failed')
      setError(getErrorMessage(requestError, 'Failed to request password reset'))
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Forgot password</h1>
        <p>Request a one-time password reset link for your account.</p>

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
            {status === 'loading' ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login">Back to sign in</Link>
          <span>
            Need email verification instead? <Link to="/verify-email">Verify email</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
