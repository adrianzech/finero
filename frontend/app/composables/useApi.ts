import type { UseFetchOptions } from 'nuxt/app'

export const useApi = <T>(request: string, opts: UseFetchOptions<T> = {}) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return useFetch<T>(request, {
    baseURL: config.public.apiUrl,
    credentials: 'include',
    ...opts,
    async onRequest({ options }) {
      if (authStore.token) {
        if (authStore.isTokenExpired) {
          await authStore.refresh()
        }
        if (authStore.token) {
          options.headers = options.headers || {}
          // @ts-expect-error Authorization header can be string or array
          options.headers.Authorization = `Bearer ${authStore.token}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout()
      }
    },
  })
}
