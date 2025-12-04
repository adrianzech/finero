import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()

  // Cookies for persistence
  const _tokenCookie = useCookie('auth_token')
  const _refreshCookie = useCookie('refresh_token')

  // State
  const token = ref<string | null>(_tokenCookie.value || null)
  const refreshToken = ref<string | null>(_refreshCookie.value || null)

  // Sync cookies to state (e.g. if cleared externally or expired)
  watch(_tokenCookie, (val) => {
    if (val !== token.value) token.value = val || null
  })
  watch(_refreshCookie, (val) => {
    if (val !== refreshToken.value) refreshToken.value = val || null
  })

  const user = computed(() => {
    if (!token.value) return null
    try {
      const parts = token.value.split('.')
      const base64Url = parts[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const decoded = JSON.parse(jsonPayload)
      return {
        email: decoded.username,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        exp: decoded.exp,
      }
    } catch {
      return null
    }
  })

  const isAuthenticated = computed(() => !!token.value)
  const isTokenExpired = computed(() => {
    if (!user.value || !user.value.exp) return true
    return Date.now() / 1000 > user.value.exp - 10
  })

  interface LoginResponse {
    token: string
    refresh_token: string
  }

  async function login(email: string, password: string, rememberMe: boolean) {
    try {
      const { data, error } = await useFetch<LoginResponse>('/login_check', {
        baseURL: config.public.apiUrl,
        method: 'POST',
        body: { email, password },
      })

      if (error.value) {
        console.error('Login error:', error.value)
        return false
      }

      if (data.value && data.value.token) {
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined // 30 days

        // Update token cookie with specific maxAge
        const tokenCookie = useCookie('auth_token', { maxAge })
        tokenCookie.value = data.value.token

        // Update state
        token.value = data.value.token

        // Update refresh token cookie
        if (data.value.refresh_token) {
          const refreshCookie = useCookie('refresh_token', { maxAge })
          refreshCookie.value = data.value.refresh_token
          refreshToken.value = data.value.refresh_token
        }

        return true
      }
      return false
    } catch (err) {
      console.error('Login unexpected error:', err)
      return false
    }
  }

  async function refresh() {
    if (!refreshToken.value) return false

    try {
      const { data, error } = await useFetch<LoginResponse>('/token/refresh', {
        baseURL: config.public.apiUrl,
        method: 'POST',
        body: { refresh_token: refreshToken.value },
      })

      if (error.value) {
        logout()
        return false
      }

      if (data.value && data.value.token) {
        _tokenCookie.value = data.value.token
        token.value = data.value.token

        if (data.value.refresh_token) {
          _refreshCookie.value = data.value.refresh_token
          refreshToken.value = data.value.refresh_token
        }
        return true
      }
      return false
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    // Clear cookies
    const tCookie = useCookie('auth_token')
    const rCookie = useCookie('refresh_token')
    tCookie.value = null
    rCookie.value = null

    // Clear state
    token.value = null
    refreshToken.value = null

    navigateTo('/auth/login')
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    isTokenExpired,
    login,
    logout,
    refresh,
  }
})
