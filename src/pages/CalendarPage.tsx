import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar'
import { DayDetail } from '../components/calendar/DayDetail'
import { AddLessonModal } from '../components/lesson/AddLessonModal'
import { useCalendarStore } from '../stores/useCalendarStore'

export function CalendarPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const { selectedDate } = useCalendarStore()

  return (
    <>
      <Header showMonthNav />
      <MonthlyCalendar />
      <div className="mt-2 border-t border-gray-200">
        <DayDetail onAddLesson={() => setShowAddModal(true)} />
      </div>
      {showAddModal && selectedDate && (
        <AddLessonModal
          date={selectedDate}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
