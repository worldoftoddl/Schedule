import { Clock, Music, Users, Trash2, Edit2 } from 'lucide-react'
import type { TimeLesson, ChoreoLesson, Student } from '../../types'
import { formatCurrency } from '../../utils/format'

interface TimeLessonCardProps {
  lesson: TimeLesson
  students: Student[]
  onEdit: (lesson: TimeLesson) => void
  onDelete: (id: string) => void
}

export function TimeLessonCard({ lesson, students, onEdit, onDelete }: TimeLessonCardProps) {
  const studentNames = lesson.studentIds
    .map((id) => students.find((s) => s.id === id)?.name ?? '?')
    .join(', ')

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock size={16} className="text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-medium">타임 레슨</div>
            <div className="text-xs text-gray-400">
              {lesson.startTime} - {lesson.endTime}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => onEdit(lesson)}
            className="p-1 text-gray-300 hover:text-indigo-400 min-w-[44px] min-h-[44px] flex items-center justify-center -mt-1"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-1 text-gray-300 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
        <Users size={12} />
        <span>{studentNames || '선수 미배정'}</span>
        {lesson.studentIds.length > 0 && (
          <span className="ml-auto font-medium text-gray-700">
            {formatCurrency(lesson.pricePerStudent)}/인
          </span>
        )}
      </div>
    </div>
  )
}

interface ChoreoLessonCardProps {
  lesson: ChoreoLesson
  studentName: string
  levelName: string
  choreoTitle?: string
  onEdit: (lesson: ChoreoLesson) => void
  onDelete: (id: string) => void
}

export function ChoreoLessonCard({
  lesson,
  studentName,
  levelName,
  choreoTitle,
  onEdit,
  onDelete,
}: ChoreoLessonCardProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
            <Music size={16} className="text-purple-500" />
          </div>
          <div>
            <div className="text-sm font-medium">
              안무 레슨 <span className="text-xs text-purple-400">({levelName})</span>
            </div>
            <div className="text-xs text-gray-400">
              {lesson.startTime} - {lesson.endTime}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => onEdit(lesson)}
            className="p-1 text-gray-300 hover:text-indigo-400 min-w-[44px] min-h-[44px] flex items-center justify-center -mt-1"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-1 text-gray-300 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span>{studentName}</span>
        {choreoTitle && <span className="ml-2 text-purple-400">#{choreoTitle}</span>}
        <span className="ml-auto float-right font-medium text-gray-700">
          {formatCurrency(lesson.price)}
        </span>
      </div>
    </div>
  )
}
