<script lang="ts" setup>
import SimpleBar from 'simplebar'
import 'simplebar/dist/simplebar.min.css'

import Logo from '@/components/Logo.vue'

import type { ISidebarMenuItem } from './MenuItem.vue'
import SidebarMenuItem from './MenuItem.vue'
import { getActivatedItemParentKeys } from './helpers'

const route = useRoute()
const authStore = useAuthStore()

const props = defineProps<{
  menuItems: ISidebarMenuItem[]
}>()

const activatedParents = ref(new Set(getActivatedItemParentKeys(props.menuItems, route.path)))
const scrollRef = ref<HTMLElement | null>(null)
let simplebar: SimpleBar | undefined

watchEffect(() => {
  activatedParents.value = new Set(getActivatedItemParentKeys(props.menuItems, route.path))
  setTimeout(() => {
    if (simplebar) {
      const contentElement = simplebar.getContentElement()
      const scrollElement = simplebar.getScrollElement()
      if (contentElement) {
        const activatedItem = contentElement.querySelector<HTMLElement>('.active')
        const top = activatedItem?.getBoundingClientRect().top
        if (activatedItem && scrollElement && top && top !== 0) {
          scrollElement.scrollTo({
            top: scrollElement.scrollTop + top - 300,
            behavior: 'smooth',
          })
        }
      }
    }
  }, 100)

  // Close sidebar on mobile view
  if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
    const sidebarTrigger = document.querySelector<HTMLInputElement>('#layout-sidebar-toggle-trigger')
    if (sidebarTrigger) {
      sidebarTrigger.checked = false
    }
  }
})

onMounted(() => {
  simplebar = new SimpleBar(scrollRef.value!)
})
</script>

<template>
  <input
    id="layout-sidebar-toggle-trigger"
    class="hidden"
    type="checkbox"
    aria-label="Toggle layout sidebar"
  >
  <input
    id="layout-sidebar-hover-trigger"
    type="checkbox"
    class="hidden"
    aria-label="Dense layout sidebar"
  >
  <div id="layout-sidebar-hover" class="bg-base-300 h-screen w-1" />

  <div
    id="layout-sidebar"
    class="sidebar-menu flex flex-col"
  >
    <div class="flex h-16 min-h-16 items-center justify-between gap-3 ps-5 pe-4">
      <NuxtLink href="#">
        <Logo />
      </NuxtLink>
    </div>

    <div class="relative min-h-0 grow">
      <div ref="scrollRef" class="size-full">
        <div class="mb-3 space-y-0.5 px-2.5">
          <SidebarMenuItem
            v-for="(item, index) in props.menuItems"
            :key="index"
            v-bind="item"
            :activated="activatedParents"
          />
        </div>
      </div>
      <div
        class="from-base-100/60 pointer-events-none absolute start-0 end-0 bottom-0 h-7 bg-linear-to-t to-transparent"
      />
    </div>

    <div class="mb-2">
      <hr class="border-base-300 my-2 border-dashed">
      <div class="dropdown dropdown-top dropdown-end w-full">
        <div
          tabindex="0"
          role="button"
          class="bg-base-200 hover:bg-base-300 rounded-box mx-2 mt-0 flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-all"
        >
          <div class="avatar">
            <div class="bg-base-200 mask mask-squircle flex w-8 items-center justify-center">
              <span class="iconify lucide--user size-5 opacity-75" />
            </div>
          </div>
          <div class="grow -space-y-0.5">
            <p class="text-sm font-medium">
              {{ [authStore.user?.firstName, authStore.user?.lastName].filter(Boolean).join(' ') || 'User' }}
            </p>
            <p class="text-base-content/60 text-xs">
              {{ authStore.user?.email || 'user@example.com' }}
            </p>
          </div>
          <span class="iconify lucide--chevrons-up-down text-base-content/60 size-4" />
        </div>
        <ul
          role="menu"
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box shadow-base-content/4 mb-1 w-48 p-1 shadow-[0px_-10px_40px_0px]"
        >
          <li>
            <a class="text-error hover:bg-error/10" @click="authStore.logout()">
              <span class="iconify lucide--log-out size-4" />
              Sign out
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <label id="layout-sidebar-backdrop" for="layout-sidebar-toggle-trigger" />
</template>
