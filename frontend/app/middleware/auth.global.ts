export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // If unauthenticated but has refresh token, try to restore session (Client-side only)
  if (import.meta.client && !authStore.isAuthenticated && authStore.refreshToken) {
    await authStore.refresh()
  }

  // Allow access to auth routes
  if (to.path.startsWith('/auth')) {
    // If logged in and trying to go to login, redirect to home
    if (authStore.isAuthenticated && to.path === '/auth/login') {
      return navigateTo('/')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    // If on server and we have a refresh token, allow rendering.
    // The client will handle the token refresh.
    if (import.meta.server && authStore.refreshToken) {
      return
    }
    return navigateTo('/auth/login')
  }
})
