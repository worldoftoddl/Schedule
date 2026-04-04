import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { db } from '../../db/schema'
import { formatDate } from '../../utils/format'
import { TimeLessonCard, ChoreoLessonCard } from './LessonCard'
import type { ChoreoLesson, Lesson } from '../../types'

interface DayDetailProps {
  onAddLesson: () => void
  onEditLesson: (lesson: Lesson) => void
}

export function DayDetail({ onAddLesson, onEditLesson }: DayDetailProps) {
  const { selectedDate } = useCalendarStore()

  const timeLessons = useLiveQuery(
    () =>
      selectedDate
        ? db.timeLessons.where('date').equals(selectedDate).sortBy('startTime')
        : [],
    [selectedDate]
  )

  const choreoLessons = useLiveQuery(
    () =>
      selectedDate
        ? db.choreoLessons.where('date').equals(selectedDate).sortBy('startTime')
        : [],
    [selectedDate]
  )

  const students = useLiveQuery(() => db.students.toArray(), [])
  const levels = useLiveQuery(() => db.choreoLevels.toArray(), [])
  const choreographies = useLiveQuery(() => db.choreographies.toArray(), [])

  // 진행률 계산을 위해 해당 choreoId들의 전체 레슨 조회
  const choreoIds = useMemo(
    () => [...new Set(choreoLessons?.map((l) => l.choreoId) ?? [])],
    [choreoLessons]
  )
  const allChoreoLessonsForIds = useLiveQuery(
    async () => {
      if (choreoIds.length === 0) return [] as ChoreoLesson[]
      return db.choreoLessons.where('choreoId').anyOf(choreoIds).sortBy('date')
    },
    [choreoIds.join(',')]
  )

  // choreoId별 현재 레슨까지의 누적 타임 계산
  const accumulatedMap = useMemo(() => {
    const map = new Map<string, number>() // key: lessonId -> accumulated hours up to this lesson
    if (!allChoreoLessonsForIds) return map
    const byChoreo = new Map<string, ChoreoLesson[]>()
    for (const l of allChoreoLessonsForIds) {
      const arr = byChoreo.get(l.choreoId) ?? []
      arr.push(l)
      byChoreo.set(l.choreoId, arr)
    }
    for (const [, lessons] of byChoreo) {
      // date순 정렬 후 누적
      lessons.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      let acc = 0
      for (const l of lessons) {
        acc += l.durationHours
        map.set(l.id, acc)
      }
    }
    return map
  }, [allChoreoLessonsForIds])

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
                accumulatedHours={accumulatedMap.get(lesson.id)}
                totalHours={choreo?.totalHours}
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
