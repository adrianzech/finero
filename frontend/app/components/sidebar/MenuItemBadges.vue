<script lang="ts" setup>
export interface ISidebarMenuItemBadges {
  badges?: Array<'new' | string>
}

const props = defineProps<ISidebarMenuItemBadges>()
</script>

<template>
  <div v-if="!props.badges || !props.badges.length" />

  <div v-else class="ms-auto inline-flex gap-2">
    <template v-for="(badge, index) in props.badges" :key="index">
      <div
        v-if="badge === 'new'"
        class="border-primary/20 bg-primary/10 text-primary rounded-box border px-1.5 text-[12px]"
      >
        New
      </div>
      <div v-else class="bg-secondary text-secondary-content rounded-box ms-0 px-1.5 text-[12px]">
        {{ badge }}
      </div>
    </template>
  </div>
</template>
