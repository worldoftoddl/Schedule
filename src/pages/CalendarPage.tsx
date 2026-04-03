import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar'
import { WeeklyTimeline } from '../components/calendar/WeeklyTimeline'
import { DayDetail } from '../components/calendar/DayDetail'
import { AddLessonModal } from '../components/lesson/AddLessonModal'
import { useCalendarStore } from '../stores/useCalendarStore'
import type { Lesson } from '../types'

export function CalendarPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const { selectedDate, viewMode } = useCalendarStore()

  return (
    <>
      <Header showMonthNav />
      {viewMode === 'weekly' ? (
        <WeeklyTimeline />
      ) : (
        <>
          <MonthlyCalendar />
          <div className="mt-2 border-t border-gray-200">
            <DayDetail
              onAddLesson={() => setShowAddModal(true)}
              onEditLesson={(lesson) => setEditLesson(lesson)}
            />
          </div>
          {showAddModal && selectedDate && (
            <AddLessonModal
              date={selectedDate}
              onClose={() => setShowAddModal(false)}
            />
          )}
          {editLesson && (
            <AddLessonModal
              date={editLesson.date}
              editLesson={editLesson}
              onClose={() => setEditLesson(null)}
            />
          )}
        </>
      )}
    </>
  )
}
