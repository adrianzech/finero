<script lang="ts" setup>
export type IBreadcrumbItem = {
  label: string
  path?: string
  active?: boolean
}

export type IPageTitle = {
  items?: IBreadcrumbItem[]
  title: string
}

// Define the props
const props = defineProps<IPageTitle>()
</script>

<template>
  <div class="flex items-center justify-between">
    <p class="text-lg font-medium">
      {{ props.title }}
    </p>

    <div v-if="$slots.centerItem">
      <slot name="centerItem" />
    </div>

    <div v-if="props.items" class="breadcrumbs hidden p-0 text-sm sm:inline">
      <ul>
        <li>
          <NuxtLink href="/">Home</NuxtLink>
        </li>
        <li v-for="(item, index) in props.items" :key="index" :class="{ 'opacity-80': item.active }">
          <template v-if="item.path">
            <NuxtLink :href="item.path">{{ item.label }}</NuxtLink>
          </template>
          <template v-else>
            {{ item.label }}
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>
