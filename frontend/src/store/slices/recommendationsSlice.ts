import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { recommendationsService } from '@/services/recommendationsService'
import { forceLogout, logoutThunk } from '@/store/slices/authSlice'
import type { Product } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface RecommendationsState {
  items: Product[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: RecommendationsState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchRecommendationsThunk = createAsyncThunk(
  'recommendations/fetch',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      return await recommendationsService.list(limit ?? 8)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load recommendations'))
    }
  },
)

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearRecommendations(state) {
      state.items = []
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendationsThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchRecommendationsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchRecommendationsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(forceLogout, () => initialState)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, () => initialState)
  },
})

export const { clearRecommendations } = recommendationsSlice.actions
export default recommendationsSlice.reducer
