import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { TimeLessonForm } from './TimeLessonForm'
import { ChoreoLessonForm } from './ChoreoLessonForm'
import { useLessons } from '../../hooks/useLessons'
import type { Lesson, LessonType } from '../../types'

interface AddLessonModalProps {
  date: string
  editLesson?: Lesson
  onClose: () => void
}

export function AddLessonModal({ date, editLesson, onClose }: AddLessonModalProps) {
  const [lessonType, setLessonType] = useState<LessonType>(editLesson?.type ?? 'time')
  const { addTimeLesson, addChoreoLesson, updateTimeLesson, updateChoreoLesson } = useLessons()

  const isEdit = !!editLesson

  return (
    <Modal title={isEdit ? '레슨 수정' : '레슨 추가'} onClose={onClose}>
      {!isEdit && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLessonType('time')}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              lessonType === 'time'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            타임 레슨
          </button>
          <button
            onClick={() => setLessonType('choreo')}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              lessonType === 'choreo'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            안무 레슨
          </button>
        </div>
      )}

      {lessonType === 'time' ? (
        <TimeLessonForm
          date={date}
          editLesson={editLesson?.type === 'time' ? editLesson : undefined}
          onSubmit={(data) => {
            if (editLesson?.type === 'time') {
              updateTimeLesson(editLesson.id, data, data.recurring)
            } else {
              addTimeLesson(data)
            }
            onClose()
          }}
          onCancel={onClose}
        />
      ) : (
        <ChoreoLessonForm
          date={date}
          editLesson={editLesson?.type === 'choreo' ? editLesson : undefined}
          onSubmit={(data) => {
            if (editLesson?.type === 'choreo') {
              updateChoreoLesson(editLesson.id, data, data.recurring)
            } else {
              addChoreoLesson(data)
            }
            onClose()
          }}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}
