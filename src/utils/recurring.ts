import { getDay } from 'date-fns'
import { getWeekdayDatesInMonth } from './calendar'
import { generateId } from './id'

export interface RecurringExpansion {
  dates: string[]
  recurringGroupId: string
}

export function expandWeeklyRecurring(
  dateStr: string,
  year: number,
  month: number
): RecurringExpansion {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dayOfWeek = getDay(new Date(y, m - 1, d))
  const dates = getWeekdayDatesInMonth(year, month, dayOfWeek)
  const recurringGroupId = generateId()

  return { dates, recurringGroupId }
}
