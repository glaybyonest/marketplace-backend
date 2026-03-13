const ACCESS_TOKEN_KEY = 'marketplace_access_token'
const REFRESH_TOKEN_KEY = 'marketplace_refresh_token'

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
