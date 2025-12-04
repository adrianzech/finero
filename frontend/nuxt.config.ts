// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
  ],
  devtools: { enabled: true },
  css: [
    '~/assets/styles/app.css',
  ],
  runtimeConfig: {
    public: {
      apiUrl: '/api',
    },
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:8000/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
