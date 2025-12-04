<script setup lang="ts">
import Sidebar from '~/components/sidebar/Index.vue'
import Topbar from '~/components/topbar/Index.vue'

import { menuItems } from './menu'
</script>

<template>
  <div class="size-full">
    <div class="flex">
      <Sidebar :menu-items="menuItems" />
      <div class="flex h-screen min-w-0 grow flex-col overflow-auto">
        <Topbar />
        <div id="layout-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
