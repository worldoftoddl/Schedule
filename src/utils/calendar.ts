import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'

export interface CalendarDay {
  date: Date
  dateKey: string // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
}

export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const target = new Date(year, month - 1, 1)
  const today = new Date()
  const monthStart = startOfMonth(target)
  const monthEnd = endOfMonth(target)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    date,
    dateKey: formatDateKey(date),
    isCurrentMonth: isSameMonth(date, target),
    isToday: isSameDay(date, today),
  }))
}

export function getWeekdayDatesInMonth(
  year: number,
  month: number,
  dayOfWeek: number
): string[] {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return allDays
    .filter((d) => getDay(d) === dayOfWeek)
    .map(formatDateKey)
}

export function navigateMonth(
  year: number,
  month: number,
  direction: 'prev' | 'next'
): { year: number; month: number } {
  const current = new Date(year, month - 1, 1)
  const result = direction === 'next' ? addMonths(current, 1) : subMonths(current, 1)
  return {
    year: result.getFullYear(),
    month: result.getMonth() + 1,
  }
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const
