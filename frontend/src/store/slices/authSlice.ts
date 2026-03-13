import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { authService } from '@/services/authService'
import type { AsyncStatus } from '@/store/types'
import type { User } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'
import { storage } from '@/utils/storage'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  status: AsyncStatus
  error: string | null
}

const initialToken = storage.getAccessToken()
const initialRefreshToken = storage.getRefreshToken()

const initialState: AuthState = {
  token: initialToken,
  refreshToken: initialRefreshToken,
  user: null,
  isAuthenticated: Boolean(initialToken),
  status: 'idle',
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to login'))
    }
  },
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.register(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to register'))
    }
  },
)

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout()
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to logout'))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: { payload: User | null }) {
      state.user = action.payload
      state.isAuthenticated = Boolean(state.token && action.payload)
    },
    forceLogout(state) {
      storage.clearTokens()
      state.token = null
      state.refreshToken = null
      state.user = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.user = action.payload.user
        state.isAuthenticated = true
        storage.setTokens(action.payload.token, action.payload.refreshToken)
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.user = action.payload.user
        state.isAuthenticated = true
        storage.setTokens(action.payload.token, action.payload.refreshToken)
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.status = 'idle'
        state.token = null
        state.refreshToken = null
        state.user = null
        state.isAuthenticated = false
        state.error = null
        storage.clearTokens()
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.error = action.payload as string
        state.token = null
        state.refreshToken = null
        state.user = null
        state.isAuthenticated = false
        storage.clearTokens()
      })
  },
})

export const { setUser, forceLogout } = authSlice.actions
export default authSlice.reducer
