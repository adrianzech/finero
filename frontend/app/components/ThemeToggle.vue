<script setup lang="ts">
const props = defineProps<{
  iconClass?: string
  class?: string
}>()

const { config } = storeToRefs(useConfig())
const { toggleTheme } = useConfig()
</script>

<template>
  <button
    v-bind="$attrs"
    :class="`relative overflow-hidden ${props.class ?? ''}`"
    aria-label="Toggle Theme"
    @click="toggleTheme"
  >
    <span
      :class="`iconify lucide--sun absolute size-4.5 transition-all duration-300 ${config.theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'} ${props.iconClass ?? ''}`"
    />
    <span
      :class="`iconify lucide--moon absolute size-4.5 transition-all duration-300 ${config.theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'} ${props.iconClass ?? ''}`"
    />
  </button>
</template>
