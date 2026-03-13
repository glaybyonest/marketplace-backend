import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { categoryService } from '@/services/categoryService'
import type { Category } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface CategoriesState {
  items: Category[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: CategoriesState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
}

export const fetchCategoriesThunk = createAsyncThunk(
  'categories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.getCategories()
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load categories'))
    }
  },
)

export const createCategoryThunk = createAsyncThunk(
  'categories/create',
  async (payload: { name: string; slug?: string }, { rejectWithValue }) => {
    try {
      return await categoryService.createCategory(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Category creation is not supported'))
    }
  },
)

export const updateCategoryThunk = createAsyncThunk(
  'categories/update',
  async (payload: { id: string; data: { name?: string; slug?: string } }, { rejectWithValue }) => {
    try {
      return await categoryService.updateCategory(payload.id, payload.data)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Category update is not supported'))
    }
  },
)

export const deleteCategoryThunk = createAsyncThunk(
  'categories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(id)
      return id
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Category deletion is not supported'))
    }
  },
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createCategoryThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = [action.payload, ...state.items]
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(updateCategoryThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateCategoryThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.map((category) =>
          category.id === action.payload.id ? action.payload : category,
        )
      })
      .addCase(updateCategoryThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(deleteCategoryThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.filter((category) => category.id !== action.payload)
      })
      .addCase(deleteCategoryThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
  },
})

export default categoriesSlice.reducer
