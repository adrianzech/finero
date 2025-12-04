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
]
