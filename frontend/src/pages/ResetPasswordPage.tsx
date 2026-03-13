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
    return 'Password must be between 8 and 72 characters'
  }

  if (!hasLatinLetterAndDigit(password)) {
    return 'Password must include at least one letter and one digit'
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match'
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
      setError('Reset token is missing from the link')
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
      setMessage('Your password has been updated. You can sign in with the new password now.')
    } catch (requestError) {
      setStatus('failed')
      setError(getErrorMessage(requestError, 'Failed to reset password'))
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Reset password</h1>
        <p>Set a new password for your account using the secure reset link.</p>

        {message ? <div className={styles.success}>{message}</div> : null}
        {error ? <ErrorMessage message={error} /> : null}

        {!token ? <div className={styles.inlineInfo}>Open this page from the link in your email.</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            New password
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
            Confirm password
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
          <p className={styles.hint}>Use 8 to 72 characters with at least one letter and one digit.</p>
          <button type="submit" disabled={status === 'loading' || !token}>
            {status === 'loading' ? 'Saving...' : 'Save new password'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login">Back to sign in</Link>
          <span>
            Need a new reset link? <Link to="/forgot-password">Request again</Link>
          </span>
        </div>
      </section>
    </div>
  )
}
