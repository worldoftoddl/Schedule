import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { db } from '../../db/schema'
import { formatDate } from '../../utils/format'
import { TimeLessonCard, ChoreoLessonCard } from './LessonCard'
import type { Lesson } from '../../types'

interface DayDetailProps {
  onAddLesson: () => void
  onEditLesson: (lesson: Lesson) => void
}

export function DayDetail({ onAddLesson, onEditLesson }: DayDetailProps) {
  const { selectedDate } = useCalendarStore()

  const timeLessons = useLiveQuery(
    () =>
      selectedDate
        ? db.timeLessons.where('date').equals(selectedDate).toArray()
        : [],
    [selectedDate]
  )

  const choreoLessons = useLiveQuery(
    () =>
      selectedDate
        ? db.choreoLessons.where('date').equals(selectedDate).toArray()
        : [],
    [selectedDate]
  )

  const students = useLiveQuery(() => db.students.toArray(), [])
  const levels = useLiveQuery(() => db.choreoLevels.toArray(), [])
  const choreographies = useLiveQuery(() => db.choreographies.toArray(), [])

  if (!selectedDate) {
    return (
      <div className="px-4 py-8 text-center text-gray-400 text-sm">
        날짜를 선택하세요
      </div>
    )
  }

  const handleDeleteTime = async (id: string) => {
    await db.timeLessons.delete(id)
    await db.payments.where('lessonId').equals(id).delete()
  }

  const handleDeleteChoreo = async (id: string) => {
    await db.choreoLessons.delete(id)
    await db.payments.where('lessonId').equals(id).delete()
  }

  const hasLessons =
    (timeLessons?.length ?? 0) + (choreoLessons?.length ?? 0) > 0

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{formatDate(selectedDate)}</h2>
        <button
          onClick={onAddLesson}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors min-h-[44px]"
        >
          <Plus size={16} />
          레슨 추가
        </button>
      </div>

      {!hasLessons ? (
        <p className="text-center text-gray-400 text-sm py-4">
          등록된 레슨이 없습니다
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {timeLessons?.map((lesson) => (
            <TimeLessonCard
              key={lesson.id}
              lesson={lesson}
              students={students ?? []}
              onEdit={(l) => onEditLesson(l)}
              onDelete={handleDeleteTime}
            />
          ))}
          {choreoLessons?.map((lesson) => {
            const level = levels?.find((l) => l.id === lesson.levelId)
            const student = students?.find((s) => s.id === lesson.studentId)
            const choreo = choreographies?.find((c) => c.id === lesson.choreoId)
            return (
              <ChoreoLessonCard
                key={lesson.id}
                lesson={lesson}
                studentName={student?.name ?? '?'}
                levelName={level?.name ?? '?'}
                choreoTitle={choreo?.title}
                onEdit={(l) => onEditLesson(l)}
                onDelete={handleDeleteChoreo}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
