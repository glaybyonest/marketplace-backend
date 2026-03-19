import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { placesService } from '@/services/placesService'
import type { RootState } from '@/store'
import { forceLogout, logoutThunk } from '@/store/slices/authSlice'
import type { Place } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'
import { storage } from '@/utils/storage'

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

const getPlacesScope = (state: RootState) => state.auth.user?.id ?? 'default'

const applySavedOrder = (items: Place[], orderedIds: string[]) => {
  if (orderedIds.length === 0) {
    return items
  }

  const itemMap = new Map(items.map((place) => [place.id, place]))
  const ordered = orderedIds.map((id) => itemMap.get(id)).filter((place): place is Place => Boolean(place))
  const knownIds = new Set(ordered.map((place) => place.id))
  const rest = items.filter((place) => !knownIds.has(place.id))

  return [...ordered, ...rest]
}

const movePlace = (items: Place[], activeId: string, overId: string) => {
  if (activeId === overId) {
    return items
  }

  const currentIndex = items.findIndex((place) => place.id === activeId)
  const nextIndex = items.findIndex((place) => place.id === overId)

  if (currentIndex === -1 || nextIndex === -1) {
    return items
  }

  const nextItems = [...items]
  const [moved] = nextItems.splice(currentIndex, 1)
  nextItems.splice(nextIndex, 0, moved)

  return nextItems
}

export const fetchPlacesThunk = createAsyncThunk(
  'places/fetch',
  async (_, { rejectWithValue, getState }) => {
    try {
      const items = await placesService.list()
      const scope = getPlacesScope(getState() as RootState)
      const orderedIds = storage.getPlaceOrder(scope)

      return {
        items: applySavedOrder(items, orderedIds),
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Не удалось загрузить адреса'))
    }
  },
)

export const createPlaceThunk = createAsyncThunk(
  'places/create',
  async (
    payload: { title: string; addressText: string; lat?: number; lon?: number },
    { rejectWithValue, getState },
  ) => {
    try {
      const place = await placesService.create(payload)
      const state = getState() as RootState
      const scope = getPlacesScope(state)
      const nextItems = [place, ...state.places.items.filter((item) => item.id !== place.id)]

      storage.setPlaceOrder(
        scope,
        nextItems.map((item) => item.id),
      )

      return {
        items: nextItems,
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Не удалось создать адрес'))
    }
  },
)

export const updatePlaceThunk = createAsyncThunk(
  'places/update',
  async (
    payload: { id: string; data: Partial<{ title: string; addressText: string; lat?: number; lon?: number }> },
    { rejectWithValue, getState },
  ) => {
    try {
      const place = await placesService.update(payload.id, payload.data)
      const state = getState() as RootState
      const scope = getPlacesScope(state)
      const nextItems = state.places.items.map((item) => (item.id === place.id ? place : item))

      storage.setPlaceOrder(
        scope,
        nextItems.map((item) => item.id),
      )

      return {
        items: nextItems,
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Не удалось обновить адрес'))
    }
  },
)

export const deletePlaceThunk = createAsyncThunk(
  'places/delete',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      await placesService.remove(id)

      const state = getState() as RootState
      const scope = getPlacesScope(state)
      const nextItems = state.places.items.filter((item) => item.id !== id)

      if (nextItems.length === 0) {
        storage.clearPlaceOrder(scope)
      } else {
        storage.setPlaceOrder(
          scope,
          nextItems.map((item) => item.id),
        )
      }

      return {
        items: nextItems,
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Не удалось удалить адрес'))
    }
  },
)

export const reorderPlacesThunk = createAsyncThunk(
  'places/reorder',
  async (payload: { activeId: string; overId: string }, { getState }) => {
    const state = getState() as RootState
    const scope = getPlacesScope(state)
    const nextItems = movePlace(state.places.items, payload.activeId, payload.overId)

    storage.setPlaceOrder(
      scope,
      nextItems.map((item) => item.id),
    )

    return {
      items: nextItems,
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
        state.error = null
      })
      .addCase(fetchPlacesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(fetchPlacesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createPlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
        state.error = null
      })
      .addCase(createPlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(createPlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(updatePlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
        state.error = null
      })
      .addCase(updatePlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(updatePlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(deletePlaceThunk.pending, (state) => {
        state.mutationStatus = 'loading'
        state.error = null
      })
      .addCase(deletePlaceThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(deletePlaceThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(reorderPlacesThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(reorderPlacesThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = action.payload.items
      })
      .addCase(reorderPlacesThunk.rejected, (state) => {
        state.mutationStatus = 'failed'
      })
      .addCase(forceLogout, () => initialState)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, () => initialState)
  },
})

export default placesSlice.reducer
