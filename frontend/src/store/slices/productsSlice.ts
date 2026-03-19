import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { productService } from '@/services/productService'
import { forceLogout, logoutThunk } from '@/store/slices/authSlice'
import type { ProductFilters } from '@/types/api'
import type { Product } from '@/types/domain'
import { getErrorMessage } from '@/utils/error'

interface ProductsState {
  items: Product[]
  selectedProduct: Product | null
  filters: ProductFilters
  page: number
  totalPages: number
  total: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  filters: {
    page: 1,
    limit: 12,
    sort: 'new',
  },
  page: 1,
  totalPages: 1,
  total: 0,
  status: 'idle',
  detailStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
}

export const fetchProductsThunk = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters | undefined, { rejectWithValue }) => {
    try {
      return await productService.getProducts(filters)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load catalog'))
    }
  },
)

export const searchProductsThunk = createAsyncThunk(
  'products/searchProducts',
  async (query: string, { rejectWithValue }) => {
    try {
      return await productService.searchProducts(query)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to search products'))
    }
  },
)

export const fetchProductThunk = createAsyncThunk(
  'products/fetchProduct',
  async (productRef: string, { rejectWithValue }) => {
    try {
      return await productService.getProduct(productRef)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load product'))
    }
  },
)

export const createProductThunk = createAsyncThunk(
  'products/createProduct',
  async (
    payload: {
      title: string
      description: string
      price: number
      categoryId: string
      stock?: number
      images?: string[]
    },
    { rejectWithValue },
  ) => {
    try {
      return await productService.createProduct(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Product creation is not supported'))
    }
  },
)

export const updateProductThunk = createAsyncThunk(
  'products/updateProduct',
  async (
    payload: {
      id: string
      data: Partial<{
        title: string
        description: string
        price: number
        categoryId: string
        stock?: number
        images?: string[]
      }>
    },
    { rejectWithValue },
  ) => {
    try {
      return await productService.updateProduct(payload.id, payload.data)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Product update is not supported'))
    }
  },
)

export const deleteProductThunk = createAsyncThunk(
  'products/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id)
      return id
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Product deletion is not supported'))
    }
  },
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters(state, action: { payload: ProductFilters }) {
      state.filters = action.payload
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null
      state.detailStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(searchProductsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPages = action.payload.totalPages
      })
      .addCase(searchProductsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchProductThunk.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchProductThunk.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.selectedProduct = action.payload
      })
      .addCase(fetchProductThunk.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(createProductThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createProductThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = [action.payload, ...state.items]
      })
      .addCase(createProductThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(updateProductThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateProductThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.map((product) =>
          product.id === action.payload.id ? action.payload : product,
        )
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload
        }
      })
      .addCase(updateProductThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(deleteProductThunk.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items = state.items.filter((product) => product.id !== action.payload)
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(forceLogout, () => initialState)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, () => initialState)
  },
})

export const { setFilters, clearSelectedProduct } = productsSlice.actions
export default productsSlice.reducer
