import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ProtectedRoute } from '@/routes/ProtectedRoute'
import authReducer from '@/store/slices/authSlice'
import categoriesReducer from '@/store/slices/categoriesSlice'
import favoritesReducer from '@/store/slices/favoritesSlice'
import placesReducer from '@/store/slices/placesSlice'
import productsReducer from '@/store/slices/productsSlice'
import recommendationsReducer from '@/store/slices/recommendationsSlice'
import userReducer from '@/store/slices/userSlice'

const createTestStore = (isAuthenticated: boolean) => {
  const authState: ReturnType<typeof authReducer> = {
    token: isAuthenticated ? 'token' : null,
    refreshToken: isAuthenticated ? 'refresh' : null,
    user: isAuthenticated
      ? {
          id: '1',
          name: 'User',
          fullName: 'User',
          email: 'user@test.local',
          role: 'customer',
        }
      : null,
    isAuthenticated,
    status: 'idle',
    error: null,
  }

  return configureStore({
    reducer: {
      auth: authReducer,
      user: userReducer,
      products: productsReducer,
      categories: categoriesReducer,
      favorites: favoritesReducer,
      places: placesReducer,
      recommendations: recommendationsReducer,
    },
    preloadedState: {
      auth: authState,
    },
  })
}

const renderRoute = (isAuthenticated: boolean) => {
  const store = createTestStore(isAuthenticated)
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secure" element={<div>Secure page</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects guest to login page', () => {
    renderRoute(false)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('allows access for authenticated user', () => {
    renderRoute(true)
    expect(screen.getByText('Secure page')).toBeInTheDocument()
  })
})
