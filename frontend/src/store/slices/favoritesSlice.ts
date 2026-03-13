import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { favoritesService } from '@/services/favoritesService'
import type { Product } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface FavoritesState {
  items: Product[]
  page: number
  total: number
  totalPages: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: FavoritesState = {
  items: [],
  page: 1,
  total: 0,
  totalPages: 1,
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
}

export const fetchFavoritesThunk = createAsyncThunk(
  'favorites/fetch',
  async (payload: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      return await favoritesService.list(payload?.page ?? 1, payload?.limit ?? 50)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load favorites'))
    }
  },
)

export const addFavoriteThunk = createAsyncThunk(
  'favorites/add',
  async (productId: string, { dispatch, rejectWithValue }) => {
    try {
      await favoritesService.add(productId)
      await dispatch(fetchFavoritesThunk({ page: 1, limit: 50 }))
      return productId
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to add favorite'))
    }
  },
)

export const removeFavoriteThunk = createAsyncThunk(
  'favorites/remove',
  async (productId: string, { dispatch, rejectWithValue }) => {
    try {
      await favoritesService.remove(productId)
      await dispatch(fetchFavoritesThunk({ page: 1, limit: 50 }))
      return productId
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to remove favorite'))
    }
  },
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites(state) {
      state.items = []
      state.page = 1
      state.total = 0
      state.totalPages = 1
      state.status = 'idle'
      state.mutationStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoritesThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFavoritesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.page = action.payload.page
        state.total = action.payload.total
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchFavoritesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(addFavoriteThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(addFavoriteThunk.fulfilled, (state) => {
        state.mutationStatus = 'succeeded'
      })
      .addCase(addFavoriteThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(removeFavoriteThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(removeFavoriteThunk.fulfilled, (state) => {
        state.mutationStatus = 'succeeded'
      })
      .addCase(removeFavoriteThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
  },
})

export const { clearFavorites } = favoritesSlice.actions
export default favoritesSlice.reducer
