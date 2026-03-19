import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { placesService } from '@/services/placesService'
import { forceLogout, logoutThunk } from '@/store/slices/authSlice'
import type { Place } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface PlacesState {
  items: Place[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: PlacesState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
}

export const fetchPlacesThunk = createAsyncThunk('places/fetch', async (_, { rejectWithValue }) => {
  try {
    return await placesService.list()
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load places'))
  }
})

export const createPlaceThunk = createAsyncThunk(
  'places/create',
  async (
    payload: { title: string; addressText: string; lat?: number; lon?: number },
    { rejectWithValue },
  ) => {
    try {
      return await placesService.create(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create place'))
    }
  },
)

export const updatePlaceThunk = createAsyncThunk(
  'places/update',
  async (
    payload: { id: string; data: Partial<{ title: string; addressText: string; lat?: number; lon?: number }> },
    { rejectWithValue },
  ) => {
    try {
      return await placesService.update(payload.id, payload.data)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update place'))
    }
  },
)

export const deletePlaceThunk = createAsyncThunk(
  'places/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await placesService.remove(id)
      return id
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete place'))
    }
  },
)

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlacesThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchPlacesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchPlacesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createPlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createPlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = [action.payload, ...state.items]
      })
      .addCase(createPlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(updatePlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updatePlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.map((place) => (place.id === action.payload.id ? action.payload : place))
      })
      .addCase(updatePlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(deletePlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(deletePlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.filter((place) => place.id !== action.payload)
      })
      .addCase(deletePlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(forceLogout, () => initialState)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, () => initialState)
  },
})

export default placesSlice.reducer
