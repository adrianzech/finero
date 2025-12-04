<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue'

definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div>
    <PageTitle title="Dashboard" :items="[{ label: 'Home', active: true }]" />
    <div class="mt-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            Welcome
          </h2>
        </div>
      </div>
    </div>
  </div>
</template>
