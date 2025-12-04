<script setup lang="ts">

</script>

<template>
  <div
    id="layout-topbar"
    role="navigation"
    aria-label="Navbar"
    class="flex items-center justify-between px-3"
  >
    <div class="inline-flex items-center gap-3">
      <label
        class="btn btn-square btn-ghost btn-sm"
        aria-label="Leftmenu toggle"
        for="layout-sidebar-toggle-trigger"
      >
        <span class="iconify lucide--menu size-5" />
      </label>
    </div>
    <div class="inline-flex items-center gap-0.5">
      <ThemeToggle class="btn btn-sm btn-circle btn-ghost" />
    </div>
  </div>
</template>
