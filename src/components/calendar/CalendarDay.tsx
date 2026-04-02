import type { CalendarDay as CalendarDayType } from '../../utils/calendar'

interface CalendarDayProps {
  day: CalendarDayType
  isSelected: boolean
  timeLessonCount: number
  choreoLessonCount: number
  onSelect: (dateKey: string) => void
}

export function CalendarDay({
  day,
  isSelected,
  timeLessonCount,
  choreoLessonCount,
  onSelect,
}: CalendarDayProps) {
  const dayNumber = day.date.getDate()

  return (
    <button
      onClick={() => onSelect(day.dateKey)}
      className={`
        relative flex flex-col items-center justify-start p-1 min-h-[52px] rounded-lg transition-colors
        ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
        ${day.isToday ? 'font-bold' : ''}
        ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}
      `}
    >
      <span
        className={`text-sm leading-none ${
          day.isToday
            ? 'bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
            : ''
        }`}
      >
        {dayNumber}
      </span>
      {(timeLessonCount > 0 || choreoLessonCount > 0) && (
        <div className="flex gap-0.5 mt-1">
          {timeLessonCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
          {choreoLessonCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          )}
        </div>
      )}
    </button>
  )
}
