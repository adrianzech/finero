<script setup lang="ts">
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type PaginationState,
} from '@tanstack/vue-table'

import PageTitle from '~/components/PageTitle.vue'
import type { RecurringCategory, RecurringCategoryCollection, RecurringExpense, RecurringExpenseCollection, RecurringInterval } from '~/types/recurring'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const authStore = useAuthStore()
const config = useRuntimeConfig()

// State
const expenses = ref<RecurringExpense[]>([])
const pending = ref(false)
const error = ref<Error | null>(null)
const categories = ref<RecurringCategory[]>([])

// Computed total items from data (since we fetch all)
const totalItems = computed(() => expenses.value.length)

// Table State
const sorting = ref<SortingState>([{ id: 'nextBillingDate', desc: false }])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const globalFilter = ref('')
const columnVisibility = ref<VisibilityState>({})
const columnOrder = ref<ColumnOrderState>([])

// Search Debounce
const debouncedSearch = ref('')
let searchTimeout: NodeJS.Timeout

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = globalFilter.value
    pagination.value.pageIndex = 0 // Reset to first page on search
  }, 300)
}

// Column Definitions
const columnHelper = createColumnHelper<RecurringExpense>()

const intervalLabels: Record<RecurringInterval, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

const getCategoryIri = (category: RecurringCategory) => {
  return category['@id'] ?? (category.id ? `/api/recurring_categories/${category.id}` : '')
}

const categoriesByIri = computed(() => {
  return new Map(categories.value.map((category) => [getCategoryIri(category), category]))
})

const resolveCategoryName = (value: RecurringExpense['category']) => {
  if (!value) return ''
  if (typeof value === 'object') return value.name ?? ''
  return categoriesByIri.value.get(value)?.name ?? ''
}

const formatAmount = (expense: RecurringExpense) => {
  const amountNumber = Number(expense.amount)
  // If the amount is not a valid number, display it as-is with its currency.
  if (Number.isNaN(amountNumber)) {
    return `${expense.amount} ${expense.currency}`
  }
  // Format the number as currency. Assuming the amount from backend is always a valid number
  // and the currency code is valid.
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: expense.currency,
    maximumFractionDigits: 2,
  }).format(amountNumber)
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  // If the value cannot be parsed into a valid date, return the original value.
  if (Number.isNaN(date.getTime())) {
    return value
  }
  // Format the date using a medium date style.
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

const columns = [
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('category', {
    id: 'category',
    header: 'Category',
    cell: (info) => resolveCategoryName(info.getValue()) || '—',
  }),
  columnHelper.accessor('amount', {
    id: 'amount',
    header: 'Amount',
    cell: (info) => formatAmount(info.row.original),
  }),
  columnHelper.accessor('interval', {
    id: 'interval',
    header: 'Interval',
    cell: (info) => intervalLabels[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.accessor('nextBillingDate', {
    id: 'nextBillingDate',
    header: 'Next Billing',
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor('isActive', {
    id: 'isActive',
    header: 'Status',
    // @ts-expect-error The API returns 'isActive' now thanks to SerializedName, but we want to be safe
    cell: (info) => (info.getValue() ? 'Active' : 'Paused'),
  }),
  columnHelper.accessor('notes', {
    id: 'notes',
    header: 'Notes',
    cell: (info) => info.getValue() || '—',
  }),
]

// Initialize column order if empty
if (columnOrder.value.length === 0) {
  columnOrder.value = columns.map((c) => c.id as string)
}

// Persistence
const LOCAL_STORAGE_KEY = 'recurring_expenses_table_settings'

onMounted(() => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.columnVisibility) columnVisibility.value = parsed.columnVisibility
      if (parsed.columnOrder) {
        const savedOrder = parsed.columnOrder as string[]
        const allColumnIds = columns.map((c) => c.id as string)
        const missing = allColumnIds.filter((id) => !savedOrder.includes(id))
        columnOrder.value = [...savedOrder, ...missing]
      }
      if (parsed.pageSize) pagination.value.pageSize = parsed.pageSize
    } catch (e) {
      console.error('Failed to parse saved table settings', e)
    }
  }

  if (authStore.token) {
    loadExpenses()
    loadCategories()
  }
})

watch([columnVisibility, columnOrder, () => pagination.value.pageSize], () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    columnVisibility: columnVisibility.value,
    columnOrder: columnOrder.value,
    pageSize: pagination.value.pageSize,
  }))
}, { deep: true })

// Table Instance
const table = useVueTable({
  get data() {
    return expenses.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    get sorting() {
      return sorting.value
    },
    get pagination() {
      return pagination.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnOrder() {
      return columnOrder.value
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value = typeof updater === 'function' ? updater(columnVisibility.value) : updater
  },
  onColumnOrderChange: (updater) => {
    columnOrder.value = typeof updater === 'function' ? updater(columnOrder.value) : updater
  },
})

// Drag and Drop Logic
const draggingColumnId = ref<string | null>(null)
const menuColumnOrder = ref<string[]>([])
const showColumnDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleColumnDropdown = () => {
  showColumnDropdown.value = !showColumnDropdown.value
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      showColumnDropdown.value = false
    }
  })
})

// Sync menu order with table order when not dragging
watch(columnOrder, (newOrder) => {
  if (!draggingColumnId.value) {
    menuColumnOrder.value = [...newOrder]
  }
}, { immediate: true })

const menuColumns = computed(() => {
  const allColumns = table.getAllLeafColumns()
  // Create a map for fast lookup
  const columnMap = new Map(allColumns.map((c) => [c.id, c]))

  // Return columns in the order of menuColumnOrder
  // Filter out any IDs that might not exist (safety)
  return menuColumnOrder.value
    .map((id) => columnMap.get(id))
    .filter((c): c is typeof allColumns[0] => !!c)
})

const onDragStart = (e: DragEvent, columnId: string) => {
  draggingColumnId.value = columnId
  e.dataTransfer?.setData('text/plain', columnId)
  e.dataTransfer!.effectAllowed = 'move'
}

const onDragOver = (e: DragEvent, targetId: string) => {
  const draggedId = draggingColumnId.value
  if (!draggedId || draggedId === targetId) return

  const currentOrder = [...menuColumnOrder.value]
  const fromIndex = currentOrder.indexOf(draggedId)
  const toIndex = currentOrder.indexOf(targetId)

  if (fromIndex === -1 || toIndex === -1) return

  // Threshold Logic: Only swap the items in the menu order if the dragged item
  // crosses the centerline of the target item. This prevents rapid, jumpy swaps
  // when hovering near the edges of items.
  const targetElement = e.currentTarget as HTMLElement
  const { top, height } = targetElement.getBoundingClientRect()
  const hoverClientY = e.clientY
  const hoverMiddleY = top + height / 2

  // If dragging downwards and mouse is in the upper half of the target, do nothing.
  // This means the item hasn't fully crossed into the next slot yet.
  if (fromIndex < toIndex && hoverClientY < hoverMiddleY) {
    return
  }

  // If dragging upwards and mouse is in the lower half of the target, do nothing.
  // This means the item hasn't fully crossed into the previous slot yet.
  if (fromIndex > toIndex && hoverClientY > hoverMiddleY) {
    return
  }

  // Perform the swap in the menuColumnOrder array
  currentOrder.splice(fromIndex, 1) // Remove dragged item from its original position
  currentOrder.splice(toIndex, 0, draggedId) // Insert dragged item into new position
  menuColumnOrder.value = currentOrder
}

const onDrop = () => {
  // Commit changes to actual table
  if (draggingColumnId.value) {
    columnOrder.value = [...menuColumnOrder.value]
  }
}

const onDragEnd = () => {
  draggingColumnId.value = null
  // Revert menu to table state (if drop wasn't committed, this reverts changes.
  // If drop WAS committed, columnOrder is same as menuColumnOrder, so no change)
  menuColumnOrder.value = [...columnOrder.value]
}

const onContainerDrop = () => {
  const draggedId = draggingColumnId.value
  if (!draggedId) return

  const currentOrder = [...menuColumnOrder.value]
  const fromIndex = currentOrder.indexOf(draggedId)

  if (fromIndex !== -1) {
    currentOrder.splice(fromIndex, 1)
    currentOrder.push(draggedId)
    menuColumnOrder.value = currentOrder

    // Commit immediately
    columnOrder.value = [...currentOrder]
  }
}

const resetColumns = () => {
  columnOrder.value = columns.map((c) => c.id as string)
  columnVisibility.value = {}
  menuColumnOrder.value = [...columnOrder.value]
}

// Data Fetching
interface FetchRecurringExpensesParams {
  pagination: boolean
  name?: string
}

const loadCategories = async () => {
  if (!authStore.token) return
  if (authStore.isTokenExpired) {
    await authStore.refresh()
  }
  if (!authStore.token) return

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
  } catch (err) {
    console.error('Could not load categories.', err)
  }
}

const loadExpenses = async () => {
  if (!authStore.token) return
  if (authStore.isTokenExpired) {
    await authStore.refresh()
  }
  if (!authStore.token) return

  pending.value = true
  error.value = null

  try {
    const params: FetchRecurringExpensesParams = {
      pagination: false,
    }

    // Search (Server-side filtering)
    if (debouncedSearch.value) {
      params['name'] = debouncedSearch.value
    }

    const result = await $fetch<RecurringExpenseCollection>('recurring_expenses', {
      baseURL: config.public.apiUrl,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        Accept: 'application/ld+json',
      },
      query: params,
    })

    const items = result?.['hydra:member'] ?? result?.member ?? []
    expenses.value = items
    // totalItems is computed property now
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err
    } else {
      error.value = new Error('Could not load expenses.')
    }
  } finally {
    pending.value = false
  }
}

// Watcher for search (re-fetch)
watch(debouncedSearch, () => {
  loadExpenses()
})

watch(() => authStore.token, (token) => {
  if (token) {
    loadExpenses()
    loadCategories()
  }
})
</script>

<template>
  <div class="space-y-6">
    <PageTitle
      title="Recurring Expenses"
      :items="[
        { label: 'Recurring Expenses', active: true },
      ]"
    />

    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 relative z-20">
          <div class="inline-flex items-center gap-3">
            <label class="input input-sm input-bordered flex items-center gap-2">
              <span class="iconify lucide--search text-base-content/80 size-3.5" />
              <input
                v-model="globalFilter"
                type="text"
                class="w-24 sm:w-36 grow border-0 focus:ring-0 p-0"
                placeholder="Search..."
                @input="onSearchInput"
              >
            </label>
          </div>

          <div class="inline-flex items-center gap-3">
            <NuxtLink to="/recurring/expenses/create" class="btn btn-primary btn-sm max-sm:btn-square">
              <span class="iconify lucide--plus size-4" />
              <span class="hidden sm:inline">Add Expense</span>
            </NuxtLink>

            <!-- Column Visibility Dropdown -->
            <div ref="dropdownRef" class="relative">
              <button
                type="button"
                class="btn btn-ghost border-base-300 btn-sm btn-square"
                aria-label="Column settings"
                @click.stop="toggleColumnDropdown"
              >
                <span class="iconify lucide--settings-2 size-4" />
              </button>

              <div
                v-if="showColumnDropdown"
                class="absolute right-0 top-full mt-2 bg-base-100 rounded-box z-50 min-w-max max-w-md shadow-lg border border-base-200 flex flex-col"
              >
                <div class="px-2 py-1.5 border-b border-base-200">
                  <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider px-2">Visible Columns</span>
                </div>
                <TransitionGroup
                  tag="ul"
                  name="list"
                  class="menu p-1 min-h-[50px] overflow-y-auto max-h-[300px] flex-1 gap-0.5"
                  @dragover.prevent
                  @drop="onContainerDrop"
                >
                  <li
                    v-for="column in menuColumns"
                    :key="column.id"
                    draggable="true"
                    class="mb-0"
                    @dragstart="onDragStart($event, column.id)"
                    @dragover.prevent="onDragOver($event, column.id)"
                    @drop.stop="onDrop"
                    @dragend="onDragEnd"
                  >
                    <div
                      class="flex items-center justify-between py-2 px-3 rounded-md transition-colors duration-200 cursor-grab active:cursor-grabbing border select-none w-full"
                      :class="{
                        'border-dashed border-2 border-base-content/20 bg-base-100 opacity-50': draggingColumnId === column.id,
                        'border-transparent hover:bg-base-200': draggingColumnId !== column.id,
                      }"
                    >
                      <div class="flex items-center gap-3 overflow-hidden">
                        <span class="iconify lucide--grip-vertical size-4 text-base-content/40 shrink-0" />
                        <span class="text-sm font-medium truncate">{{ column.columnDef.header }}</span>
                      </div>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary shrink-0 ml-4"
                        :checked="column.getIsVisible()"
                        @change="column.toggleVisibility($event.target.checked)"
                      >
                    </div>
                  </li>
                </TransitionGroup>
                <div class="p-1 border-t border-base-200">
                  <button
                    class="btn btn-sm btn-ghost w-full justify-start font-normal text-base-content/60 hover:text-error hover:bg-error/10 px-3 gap-3"
                    @click="resetColumns"
                  >
                    <span class="iconify lucide--rotate-ccw size-4" />
                    Reset to defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-error m-5">
          <span class="iconify lucide--alert-octagon size-5" />
          <span>Could not load expenses. {{ error?.message }}</span>
        </div>

        <!-- Table Content -->
        <div v-else class="mt-4 overflow-auto">
          <div v-if="pending && expenses.length === 0" class="flex items-center justify-center py-10">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <div v-else-if="expenses.length === 0 && !globalFilter" class="flex items-center justify-center py-10 text-base-content/70">
            No recurring expenses yet. Add your first one.
          </div>

          <table v-else class="table">
            <thead>
              <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <th
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  class="text-xs font-semibold uppercase tracking-wide hover:bg-base-200 transition-colors"
                >
                  <div v-if="!header.isPlaceholder" class="flex items-center gap-2">
                    <!-- Sorting and Header Content -->
                    <button
                      v-if="header.column.getCanSort()"
                      type="button"
                      class="flex items-center gap-1 grow text-left font-medium"
                      @click="header.column.getToggleSortingHandler()?.($event)"
                    >
                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                      <span v-if="header.column.getIsSorted() === 'asc'" class="iconify lucide--chevron-up size-3.5" />
                      <span v-else-if="header.column.getIsSorted() === 'desc'" class="iconify lucide--chevron-down size-3.5" />
                      <span v-else class="iconify lucide--chevrons-up-down size-3.5 opacity-50" />
                    </button>
                    <template v-else>
                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                    </template>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in table.getRowModel().rows" :key="row.id" class="hover:bg-base-200/40">
                <td v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </td>
              </tr>
              <tr v-if="expenses.length === 0 && globalFilter">
                <td :colspan="columns.length" class="text-center py-8 text-base-content/70">
                  No results found for "{{ globalFilter }}"
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-6 relative z-10">
          <div class="text-base-content/80 hover:text-base-content flex gap-2 text-sm items-center">
            <span class="hidden sm:inline">Per page</span>
            <select
              class="select select-xs w-18"
              aria-label="Rows per page"
              :value="table.getState().pagination.pageSize"
              @change="table.setPageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="5">
                5
              </option>
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="50">
                50
              </option>
            </select>
          </div>

          <span class="text-base-content/80 hidden text-sm lg:inline">
            Showing
            <span class="text-base-content font-medium">{{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}</span>
            to
            <span class="text-base-content font-medium">{{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalItems) }}</span>
            of
            <span class="text-base-content font-medium">{{ totalItems }}</span>
            items
          </span>

          <div class="inline-flex items-center gap-1">
            <button
              class="btn btn-circle sm:btn-sm btn-xs btn-ghost"
              aria-label="Prev"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()"
            >
              <span class="iconify lucide--chevron-left size-4" />
            </button>

            <button
              v-for="pageIndex in table.getPageCount()"
              :key="pageIndex"
              class="btn btn-circle sm:btn-sm btn-xs"
              :class="pageIndex === table.getState().pagination.pageIndex + 1 ? 'btn-primary' : 'btn-ghost'"
              @click="table.setPageIndex(pageIndex - 1)"
            >
              {{ pageIndex }}
            </button>

            <button
              class="btn btn-circle sm:btn-sm btn-xs btn-ghost"
              aria-label="Next"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()"
            >
              <span class="iconify lucide--chevron-right size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
