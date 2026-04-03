import { getDay, eachDayOfInterval } from 'date-fns'
import { getWeekdayDatesInMonth, formatDateKey } from './calendar'
import { generateId } from './id'

export interface RecurringExpansion {
  dates: string[]
  recurringGroupId: string
}

export function expandWeeklyRecurring(
  dateStr: string,
  year: number,
  month: number,
  untilDate?: string
): RecurringExpansion {
  const [y, m, d] = dateStr.split('-').map(Number)
  const startDate = new Date(y, m - 1, d)
  const dayOfWeek = getDay(startDate)
  const recurringGroupId = generateId()

  if (untilDate) {
    const [uy, um, ud] = untilDate.split('-').map(Number)
    const endDate = new Date(uy, um - 1, ud)
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    const dates = allDays
      .filter((dt) => getDay(dt) === dayOfWeek)
      .map(formatDateKey)
    return { dates, recurringGroupId }
  }

  const dates = getWeekdayDatesInMonth(year, month, dayOfWeek)
  return { dates, recurringGroupId }
}
