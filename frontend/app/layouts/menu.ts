import type { ISidebarMenuItem } from '~/components/sidebar/MenuItem.vue'

export const menuItems: ISidebarMenuItem[] = [
  {
    id: 'overview-label',
    isTitle: true,
    label: 'Overview',
  },
  {
    id: 'dashboard',
    icon: 'lucide--layout-dashboard',
    label: 'Dashboard',
    url: '/',
  },
  {
    id: 'recurring-label',
    isTitle: true,
    label: 'Recurring',
  },
  {
    id: 'recurring-expenses',
    icon: 'lucide--repeat-2',
    label: 'Recurring Expenses',
    url: '/recurring/expenses',
  },
  {
    id: 'recurring-categories',
    icon: 'lucide--tag',
    label: 'Recurring Categories',
    url: '/recurring/categories',
  },
]
