<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue'
import type { RecurringCategory, RecurringCategoryCollection } from '~/types/recurring'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const authStore = useAuthStore()
const config = useRuntimeConfig()

const categories = ref<RecurringCategory[]>([])
const pending = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  name: '',
})
const formError = ref<string | null>(null)
const isSubmitting = ref(false)

const loadCategories = async () => {
  if (!authStore.token) return
  if (authStore.isTokenExpired) {
    await authStore.refresh()
  }
  if (!authStore.token) return

  pending.value = true
  error.value = null

  try {
    const result = await $fetch<RecurringCategoryCollection>('recurring_categories', {
      baseURL: config.public.apiUrl,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        Accept: 'application/ld+json',
      },
    })

    categories.value = result?.['hydra:member'] ?? result?.member ?? []
  } catch (err: unknown) {
    const message = (err as { data?: Record<string, unknown> })?.data?.['hydra:description'] as string
    error.value = message || 'Could not load categories.'
  } finally {
    pending.value = false
  }
}

const submitCategory = async () => {
  formError.value = null
  if (!form.name.trim()) {
    formError.value = 'Category name is required.'
    return
  }

  isSubmitting.value = true
  try {
    if (authStore.isTokenExpired) {
      await authStore.refresh()
    }
    if (!authStore.token) {
      authStore.logout()
      return
    }

    await $fetch<RecurringCategory>('recurring_categories', {
      method: 'POST',
      baseURL: config.public.apiUrl,
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/ld+json',
        'Content-Type': 'application/ld+json',
      },
      body: {
        name: form.name.trim(),
      },
    })

    form.name = ''
    loadCategories()
  } catch (err: unknown) {
    const message = (err as { data?: Record<string, unknown> })?.data?.['hydra:description'] as string
    formError.value = message || 'Could not create category.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (authStore.token) {
    loadCategories()
  }
})

watch(() => authStore.token, (token) => {
  if (token) loadCategories()
})
</script>

<template>
  <div class="space-y-6">
    <PageTitle
      title="Recurring Categories"
      :items="[
        { label: 'Recurring Categories', active: true },
      ]"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="card-title">
            Add Category
          </div>
          <form class="mt-2 space-y-4" @submit.prevent="submitCategory">
            <div class="space-y-2">
              <label class="fieldset-label" for="categoryName">Name</label>
              <input
                id="categoryName"
                v-model="form.name"
                type="text"
                class="input w-full"
                placeholder="e.g. Insurance"
              >
            </div>
            <div>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                Create Category
              </button>
            </div>
            <p v-if="formError" class="text-sm text-error">
              {{ formError }}
            </p>
          </form>
        </div>
      </div>

      <div class="card bg-base-100 shadow lg:col-span-2">
        <div class="card-body">
          <div class="card-title">
            Categories
          </div>
          <div v-if="pending" class="text-sm text-base-content/70">
            Loading categories...
          </div>
          <div v-else-if="error" class="text-sm text-error">
            {{ error }}
          </div>
          <div v-else>
            <div v-if="categories.length === 0" class="text-sm text-base-content/70">
              No categories yet. Add your first one.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in categories" :key="category['@id'] ?? category.id">
                    <td>{{ category.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
