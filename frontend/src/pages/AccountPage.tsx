import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProfileThunk, updateProfileThunk } from '@/store/slices/userSlice'

import styles from '@/pages/AccountPage.module.scss'

export const AccountPage = () => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const { profile, status, updateStatus, error } = useAppSelector((state) => state.user)

  const [fullNameDraft, setFullNameDraft] = useState<string | undefined>(undefined)
  const [phoneDraft, setPhoneDraft] = useState<string | undefined>(undefined)

  useEffect(() => {
    dispatch(fetchProfileThunk())
  }, [dispatch])

  const fullName = fullNameDraft ?? profile?.fullName ?? authUser?.fullName ?? authUser?.name ?? ''
  const email = profile?.email ?? authUser?.email ?? '-'
  const phone = phoneDraft ?? profile?.phone ?? authUser?.phone ?? ''
  const isVerified = Boolean(profile?.isEmailVerified ?? authUser?.isEmailVerified ?? authUser?.emailVerifiedAt)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await dispatch(updateProfileThunk({ fullName, phone }))
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className="badge-pill">Личный кабинет</span>
          <h1>{fullName || 'Ваш аккаунт'}</h1>
          <p>Управляйте профилем, адресами доставки, избранным, заказами и способами входа из одного места.</p>
        </div>
        <div className={styles.heroMeta}>
          <div>
            <span>Email</span>
            <strong>{email}</strong>
          </div>
          <div>
            <span>Телефон</span>
            <strong>{phone || 'Не указан'}</strong>
          </div>
          <div>
            <span>Статус</span>
            <strong>{isVerified ? 'Почта подтверждена' : 'Нужно подтвердить почту'}</strong>
          </div>
          <div>
            <span>Роль</span>
            <strong>{authUser?.role === 'admin' ? 'Администратор' : 'Покупатель'}</strong>
          </div>
        </div>
      </section>

      {status === 'loading' ? <AppLoader label="Загружаем профиль..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <div className={styles.content}>
        <section className={`${styles.formCard} page-card`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className="badge-pill">Профиль</span>
              <h2>Основные данные</h2>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Имя
              <input value={fullName} onChange={(event) => setFullNameDraft(event.target.value)} />
            </label>
            <label>
              Email
              <input value={email} disabled />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhoneDraft(event.target.value)}
                placeholder="+7 999 123-45-67"
                autoComplete="tel"
              />
            </label>
            <p className={styles.inlineInfo}>Этот номер используется для входа по одноразовому коду, если вы включите такой сценарий.</p>
            <button type="submit" className="action-primary" disabled={updateStatus === 'loading'}>
              {updateStatus === 'loading' ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </form>
        </section>

        <section className={styles.linksGrid}>
          <Link to="/cart" className={styles.linkCard}>
            <strong>Корзина</strong>
            <p>Проверьте текущий состав заказа и перейдите к оформлению.</p>
          </Link>
          <Link to="/account/orders" className={styles.linkCard}>
            <strong>Заказы</strong>
            <p>История оформленных заказов и адресов доставки.</p>
          </Link>
          <Link to="/favorites" className={styles.linkCard}>
            <strong>Избранное</strong>
            <p>Подборка товаров, которые вы сохранили на потом.</p>
          </Link>
          <Link to="/account/places" className={styles.linkCard}>
            <strong>Адреса</strong>
            <p>Места доставки для checkout и персонального сценария получения.</p>
          </Link>
          <Link to="/account/sessions" className={styles.linkCard}>
            <strong>Сессии</strong>
            <p>Активные устройства и быстрый отзыв доступа.</p>
          </Link>
          {authUser?.role === 'admin' ? (
            <Link to="/admin" className={styles.linkCard}>
              <strong>Админка</strong>
              <p>Управление каталогом, категориями и карточками товаров.</p>
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  )
}
