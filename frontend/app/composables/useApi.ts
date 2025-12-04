export const useApi = (request: unknown, opts: unknown = {}) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return useFetch(request, {
    baseURL: config.public.apiUrl,
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
