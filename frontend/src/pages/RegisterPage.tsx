import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerThunk } from '@/store/slices/authSlice'

import styles from '@/pages/AuthPage.module.scss'

export const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const authState = useAppSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await dispatch(registerThunk({ name, email, password }))
    if (registerThunk.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Регистрация</h1>
        <p>Создайте аккаунт покупателя, продавца или администратора.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {authState.error ? <ErrorMessage message={authState.error} /> : null}
          <button type="submit" disabled={authState.status === 'loading'}>
            {authState.status === 'loading' ? 'Создаем аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </div>
  )
}
