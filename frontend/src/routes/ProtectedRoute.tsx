import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { useAppSelector } from '@/store/hooks'
import type { UserRole } from '@/types/domain'

interface ProtectedRouteProps {
  requiredRole?: Exclude<UserRole, 'guest'>
}

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const location = useLocation()
  const { isAuthenticated, user, sessionBootstrapped } = useAppSelector((state) => state.auth)

  if (!sessionBootstrapped) {
    return <AppLoader label="Восстанавливаем сессию..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredRole && !user) {
    return <AppLoader label="Проверяем доступ..." />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
