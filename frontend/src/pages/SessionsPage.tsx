import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { sessionService } from '@/services/sessionService'
import { useAppDispatch } from '@/store/hooks'
import { forceLogout } from '@/store/slices/authSlice'
import type { SessionInfo } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

import styles from '@/pages/SessionsPage.module.scss'

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export const SessionsPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [busySessionID, setBusySessionID] = useState<string | null>(null)
  const [revokeAllBusy, setRevokeAllBusy] = useState(false)

  const loadSessions = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const items = await sessionService.list()
      setSessions(items)
      setStatus('succeeded')
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось загрузить активные сессии'))
      setStatus('failed')
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const currentSession = useMemo(() => sessions.find((session) => session.isCurrent), [sessions])

  const handleRevoke = async (sessionID: string) => {
    setBusySessionID(sessionID)
    setError(null)
    try {
      await sessionService.revoke(sessionID)
      setSessions((current) => current.filter((session) => session.id !== sessionID))
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось завершить сессию'))
    } finally {
      setBusySessionID(null)
    }
  }

  const handleRevokeAll = async () => {
    setRevokeAllBusy(true)
    setError(null)
    try {
      await sessionService.revokeAll()
      dispatch(forceLogout())
      navigate('/login', {
        replace: true,
        state: { message: 'Все сессии завершены. Войдите снова.' },
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось завершить все сессии'))
      setRevokeAllBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="badge-pill">Сессии</span>
          <h1>Устройства и безопасность</h1>
          <p>Проверьте, где открыт аккаунт, и закройте сессии, которым больше не доверяете.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/account" className="action-secondary">
            Назад в кабинет
          </Link>
          <button type="button" className="action-danger" onClick={handleRevokeAll} disabled={revokeAllBusy}>
            {revokeAllBusy ? 'Завершаем...' : 'Выйти на всех устройствах'}
          </button>
        </div>
      </header>

      {status === 'loading' ? <AppLoader label="Загружаем сессии..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {currentSession ? (
        <section className={`${styles.currentCard} page-card`}>
          <strong>Текущая сессия</strong>
          <span>{currentSession.userAgent || 'Неизвестное устройство'}</span>
          <span>Последняя активность: {formatDateTime(currentSession.lastSeenAt)}</span>
        </section>
      ) : null}

      <section className={styles.list}>
        {sessions.map((session) => (
          <article key={session.id} className={styles.item}>
            <div className={styles.meta}>
              <div className={styles.titleRow}>
                <h2>{session.userAgent || 'Неизвестное устройство'}</h2>
                {session.isCurrent ? <span className={styles.badge}>Текущая</span> : null}
              </div>
              <p>IP: {session.ip || '-'}</p>
              <p>Начало: {formatDateTime(session.createdAt)}</p>
              <p>Последняя активность: {formatDateTime(session.lastSeenAt)}</p>
              <p>Истекает: {formatDateTime(session.expiresAt)}</p>
            </div>
            {!session.isCurrent ? (
              <button
                type="button"
                className="action-secondary"
                onClick={() => handleRevoke(session.id)}
                disabled={busySessionID === session.id}
              >
                {busySessionID === session.id ? 'Завершаем...' : 'Завершить сессию'}
              </button>
            ) : null}
          </article>
        ))}

        {status === 'succeeded' && sessions.length === 0 ? (
          <div className={`${styles.empty} empty-state`}>Активных сессий не найдено.</div>
        ) : null}
      </section>
    </div>
  )
}
