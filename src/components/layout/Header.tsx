import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'

interface HeaderProps {
  title?: string
  showMonthNav?: boolean
}

export function Header({ title, showMonthNav = false }: HeaderProps) {
  const { year, month, prevMonth, nextMonth } = useCalendarStore()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
        {showMonthNav ? (
          <>
            <button
              onClick={prevMonth}
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="이전 달"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold">
              {year}년 {month}월
            </h1>
            <button
              onClick={nextMonth}
              className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="다음 달"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
      </div>
    </header>
  )
}
