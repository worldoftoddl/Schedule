import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { getMonthGrid, WEEKDAY_LABELS } from '../../utils/calendar'
import { db } from '../../db/schema'
import { CalendarDay } from './CalendarDay'

export function MonthlyCalendar() {
  const { year, month, selectedDate, selectDate } = useCalendarStore()

  const grid = useMemo(() => getMonthGrid(year, month), [year, month])

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  const timeLessons = useLiveQuery(
    () => db.timeLessons.where('date').startsWith(monthPrefix).toArray(),
    [monthPrefix]
  )

  const choreoLessons = useLiveQuery(
    () => db.choreoLessons.where('date').startsWith(monthPrefix).toArray(),
    [monthPrefix]
  )

  const lessonCounts = useMemo(() => {
    const counts = new Map<string, { time: number; choreo: number }>()

    for (const lesson of timeLessons ?? []) {
      const existing = counts.get(lesson.date) ?? { time: 0, choreo: 0 }
      existing.time++
      counts.set(lesson.date, existing)
    }

    for (const lesson of choreoLessons ?? []) {
      const existing = counts.get(lesson.date) ?? { time: 0, choreo: 0 }
      existing.choreo++
      counts.set(lesson.date, existing)
    }

    return counts
  }, [timeLessons, choreoLessons])

  return (
    <div className="px-2">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day) => {
          const counts = lessonCounts.get(day.dateKey)
          return (
            <CalendarDay
              key={day.dateKey}
              day={day}
              isSelected={selectedDate === day.dateKey}
              timeLessonCount={counts?.time ?? 0}
              choreoLessonCount={counts?.choreo ?? 0}
              onSelect={selectDate}
            />
          )
        })}
      </div>
    </div>
  )
}
