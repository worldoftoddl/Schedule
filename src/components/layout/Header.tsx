import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'

interface HeaderProps {
  title?: string
  showMonthNav?: boolean
}

export function Header({ title, showMonthNav = false }: HeaderProps) {
  const { year, month, viewMode, setViewMode, prevMonth, nextMonth, prevWeek, nextWeek } = useCalendarStore()

  const isWeekly = viewMode === 'weekly'
  const handlePrev = isWeekly ? prevWeek : prevMonth
  const handleNext = isWeekly ? nextWeek : nextMonth
  const toggleViewMode = () => setViewMode(isWeekly ? 'monthly' : 'weekly')

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
        {showMonthNav ? (
          <>
            <div className="flex items-center">
              <button
                onClick={handlePrev}
                className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isWeekly ? '이전 주' : '이전 달'}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <h1 className="text-lg font-semibold">
              {year}년 {month}월
            </h1>
            <div className="flex items-center">
              <button
                onClick={handleNext}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isWeekly ? '다음 주' : '다음 달'}
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={toggleViewMode}
                className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800"
                aria-label={isWeekly ? '월별 보기' : '주간 보기'}
              >
                {isWeekly ? <CalendarDays size={20} /> : <Clock size={20} />}
              </button>
            </div>
          </>
        ) : (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
      </div>
    </header>
  )
}
