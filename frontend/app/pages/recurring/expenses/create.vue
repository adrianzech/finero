<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue'
import type { RecurringCategory, RecurringCategoryCollection, RecurringExpense, RecurringInterval } from '~/types/recurring'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const authStore = useAuthStore()
const config = useRuntimeConfig()
const router = useRouter()

const intervalOptions: { value: RecurringInterval, label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const currencyOptions = ['EUR', 'USD', 'GBP', 'CHF', 'JPY']

const form = reactive({
  name: '',
  amount: '',
  currency: 'EUR',
  interval: 'monthly' as RecurringInterval,
  nextBillingDate: '',
  category: '',
  notes: '',
  isActive: true,
})

const formError = ref<string | null>(null)
const isSubmitting = ref(false)
const categories = ref<RecurringCategory[]>([])
const categoriesLoading = ref(false)
const categoriesError = ref<string | null>(null)

const getCategoryIri = (category: RecurringCategory) => {
  return category['@id'] ?? (category.id ? `/api/recurring_categories/${category.id}` : '')
}

const loadCategories = async () => {
  categoriesLoading.value = true
  categoriesError.value = null

  try {
    if (authStore.isTokenExpired) {
      await authStore.refresh()
    }
    if (!authStore.token) {
      authStore.logout()
      return
    }

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
    categoriesError.value = message || 'Could not load categories.'
  } finally {
    categoriesLoading.value = false
  }
}

const goBack = () => {
  router.push('/recurring/expenses')
}

const submitExpense = async () => {
  formError.value = null
  if (!form.name.trim()) {
    formError.value = 'Name is required.'
    return
  }
  const normalizedAmount = Number(form.amount)
  if (Number.isNaN(normalizedAmount)) {
    formError.value = 'Amount must be a valid number.'
    return
  }
  if (!form.nextBillingDate) {
    formError.value = 'Next billing date is required.'
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
    await $fetch<RecurringExpense>('recurring_expenses', {
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
        amount: normalizedAmount.toFixed(2),
        currency: form.currency.toUpperCase(),
        interval: form.interval,
        nextBillingDate: new Date(`${form.nextBillingDate}T00:00:00`).toISOString(),
        category: form.category || null,
        notes: form.notes || null,
        isActive: form.isActive,
      },
    })

    goBack()
  } catch (err: unknown) {
    const message = (err as { data?: Record<string, unknown> })?.data?.['hydra:description'] as string
    formError.value = message || 'Could not create recurring expense.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div>
    <PageTitle
      title="Add Expense"
      :items="[
        { label: 'Recurring Expenses', path: '/recurring/expenses' },
        { label: 'Create', active: true },
      ]"
    />

    <div class="mt-6">
      <form @submit.prevent="submitExpense">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="card-title">
                Basic Information
              </div>
              <div class="fieldset mt-2 grid grid-cols-1 gap-4">
                <div class="space-y-2">
                  <label class="fieldset-label" for="name">Name</label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    class="input w-full"
                    placeholder="e.g. Adobe Creative Cloud"
                    autofocus
                  >
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="fieldset-label" for="amount">Amount</label>
                    <input
                      id="amount"
                      v-model="form.amount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input w-full"
                      placeholder="19.99"
                    >
                  </div>
                  <div class="space-y-2">
                    <label class="fieldset-label" for="currency">Currency</label>
                    <select
                      id="currency"
                      v-model="form.currency"
                      class="select w-full"
                    >
                      <option v-for="curr in currencyOptions" :key="curr" :value="curr">
                        {{ curr }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="fieldset-label" for="category">Category</label>
                  <select
                    id="category"
                    v-model="form.category"
                    class="select w-full"
                    :disabled="categoriesLoading"
                  >
                    <option value="">
                      Uncategorized
                    </option>
                    <option
                      v-for="category in categories"
                      :key="category['@id'] ?? category.id"
                      :value="getCategoryIri(category)"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                  <p v-if="categoriesError" class="text-sm text-error">
                    {{ categoriesError }}
                  </p>
                </div>

                <div class="space-y-2">
                  <label class="fieldset-label" for="notes">Notes</label>
                  <textarea
                    id="notes"
                    v-model="form.notes"
                    class="textarea w-full"
                    placeholder="Add context or cancellation details"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="card-title">
                Billing Settings
              </div>
              <div class="fieldset mt-2 grid grid-cols-1 gap-4">
                <div class="space-y-2">
                  <label class="fieldset-label" for="interval">Interval</label>
                  <select
                    id="interval"
                    v-model="form.interval"
                    class="select w-full"
                  >
                    <option v-for="option in intervalOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="fieldset-label" for="nextBillingDate">Next Billing Date</label>
                  <input
                    id="nextBillingDate"
                    v-model="form.nextBillingDate"
                    type="date"
                    class="input w-full"
                  >
                </div>

                <div class="flex items-center gap-3 mt-2">
                  <input
                    id="isActive"
                    v-model="form.isActive"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                  >
                  <label class="label cursor-pointer" for="isActive">
                    <span class="label-text">Set as active</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="formError" class="alert alert-error mt-6 text-sm">
          <span class="iconify lucide--alert-triangle size-4" />
          <span>{{ formError }}</span>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="btn btn-sm btn-ghost" @click="goBack">
            <span class="iconify lucide--x size-4" />
            Cancel
          </button>
          <button type="submit" class="btn btn-sm btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="loading loading-spinner size-4" />
            <span v-else class="iconify lucide--check size-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
