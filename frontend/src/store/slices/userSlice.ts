import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { userService } from '@/services/userService'
import { forceLogout, logoutThunk, setUser } from '@/store/slices/authSlice'
import type { AsyncStatus } from '@/store/types'
import type { User } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface UserState {
  profile: User | null
  status: AsyncStatus
  updateStatus: AsyncStatus
  error: string | null
}

const initialState: UserState = {
  profile: null,
  status: 'idle',
  updateStatus: 'idle',
  error: null,
}

export const fetchProfileThunk = createAsyncThunk(
  'user/fetchProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const user = await userService.getMe()
      dispatch(setUser(user))
      return user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load profile'))
    }
  },
)

export const updateProfileThunk = createAsyncThunk(
  'user/updateProfile',
  async (payload: { fullName?: string; name?: string; phone?: string }, { dispatch, rejectWithValue }) => {
    try {
      const user = await userService.updateMe(payload)
      dispatch(setUser(user))
      return user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update profile'))
    }
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.profile = action.payload
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(updateProfileThunk.pending, (state) => {
        state.updateStatus = 'loading'
        state.error = null
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.profile = action.payload
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(setUser, (state, action) => {
        state.profile = action.payload
      })
      .addCase(forceLogout, () => initialState)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, () => initialState)
  },
})

export default userSlice.reducer
