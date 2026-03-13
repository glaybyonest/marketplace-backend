import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAppSelector } from '@/store/hooks'

export const ProtectedRoute = () => {
  const location = useLocation()
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
