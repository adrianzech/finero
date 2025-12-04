<script lang="ts" setup>
import type { NuxtLinkProps } from '#app/components/nuxt-link'

import SidebarMenuItemBadges, { type ISidebarMenuItemBadges } from './MenuItemBadges.vue'

export interface ISidebarMenuItem {
  id: string
  icon?: string
  label: string
  isTitle?: boolean
  url?: string
  linkProp?: NuxtLinkProps
  children?: ISidebarMenuItem[]
  badges?: ISidebarMenuItemBadges['badges']
}

const props = defineProps<ISidebarMenuItem & { activated: Set<string> }>()

const selected = computed(() => props.activated.has(props.id))
</script>

<template>
  <p v-if="props.isTitle" class="menu-label px-2.5 pt-3 pb-1.5 first:pt-0">
    {{ props.label }}
  </p>

  <template v-else-if="!props.children">
    <NuxtLink
      :href="props.url ?? ''"
      class="menu-item"
      :class="{ active: selected }"
      v-bind="props.linkProp"
    >
      <span v-if="props.icon" class="iconify" :class="[props.icon, 'size-4']" />
      <span class="grow">{{ props.label }}</span>
      <SidebarMenuItemBadges :badges="props.badges" />
    </NuxtLink>
  </template>

  <template v-else>
    <div class="group collapse">
      <input
        aria-label="Sidemenu item trigger"
        type="checkbox"
        name="sidebar-menu-parent-item"
        :checked="selected"
        class="peer"
      >
      <div class="collapse-title px-2.5 py-1.5">
        <span v-if="props.icon" class="iconify" :class="[props.icon, 'size-4']" />
        <span class="grow">{{ props.label }}</span>
        <SidebarMenuItemBadges :badges="props.badges" />
        <span class="iconify lucide--chevron-right arrow-icon size-3.5" />
      </div>
      <div class="collapse-content ms-6.5 !p-0">
        <div class="mt-0.5 space-y-0.5">
          <SidebarMenuItem
            v-for="(item, index) in props.children"
            :key="index"
            v-bind="item"
            :activated="props.activated"
          />
        </div>
      </div>
    </div>
  </template>
</template>
