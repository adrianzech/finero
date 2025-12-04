import { defineStore } from 'pinia'
import { onMounted, reactive, ref, watch } from 'vue'

export const themes = ['light', 'dark'] as const

export type ITheme = (typeof themes)[number]

const localStorageKey = '__APP_CONFIG__'

export type IConfig = {
  theme: ITheme
}

const defaultConfig: IConfig = {
  theme: 'light',
}

const getConfigFromLocalStorage = (): IConfig => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(localStorageKey)
    if (saved) {
      return JSON.parse(saved) as IConfig
    }
  }
  return defaultConfig
}

export const useConfig = defineStore(localStorageKey, () => {
  const config = reactive<IConfig>(getConfigFromLocalStorage())
  const isMounted = ref(false)

  const toggleTheme = () => {
    config.theme = config.theme === 'light' ? 'dark' : 'light'
  }

  const updateConfig = (_config: IConfig) => {
    Object.assign(config, _config)
  }

  watch(
    () => ({ ...config }), // shallow clone to trigger reactivity
    (cfg) => {
      applyConfigToDOM(cfg)
      if (isMounted.value) {
        localStorage.setItem(localStorageKey, JSON.stringify(cfg))
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    isMounted.value = true
    const saved = getConfigFromLocalStorage()
    updateConfig(saved)
    applyConfigToDOM(saved)
  })

  return {
    config,
    toggleTheme,
    updateConfig,
  }
})

const applyConfigToDOM = (config: IConfig) => {
  const htmlRef = document?.documentElement
  if (!htmlRef) return

  htmlRef.setAttribute('data-theme', config.theme)
}
