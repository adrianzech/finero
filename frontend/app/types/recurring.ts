import type { HydraCollection } from './api'

export type RecurringInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type RecurringExpense = {
  id?: number
  name: string
  amount: string
  currency: string
  interval: RecurringInterval
  nextBillingDate: string
  isActive: boolean
  notes?: string | null
  provider?: string | null
  paymentMethod?: string | null
}

export type RecurringExpenseCollection = HydraCollection<RecurringExpense> & {
  member?: RecurringExpense[]
}
