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

const validateForm = (name: string, email: string, password: string): string | null => {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (!trimmedName) {
    return 'Enter your full name'
  }

  if (trimmedName.length > 120) {
    return 'Full name must be 120 characters or fewer'
  }

  if (!trimmedEmail) {
    return 'Enter your email'
  }

  if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN) {
    return 'Password must be between 8 and 72 characters'
  }

  if (!hasLatinLetterAndDigit(password)) {
    return 'Password must include at least one letter and one digit'
  }

  return null
}

export const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const authState = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm(name, email, password)
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
          message: result.payload.message ?? 'We sent a verification link to your email',
        },
      })
      return
    }

    navigate('/', { replace: true })
  }

  const shownError = localError ?? authState.error

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Create account</h1>
        <p>Create an account to save favorites, manage places, and place orders.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={120}
              required
            />
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
            Password
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
          <p className={styles.hint}>Use 8 to 72 characters with at least one letter and one digit.</p>
          {shownError ? <ErrorMessage message={shownError} /> : null}
          <button type="submit" disabled={authState.status === 'loading'}>
            {authState.status === 'loading' ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  )
}
