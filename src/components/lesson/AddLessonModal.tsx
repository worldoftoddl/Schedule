import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { TimeLessonForm } from './TimeLessonForm'
import { ChoreoLessonForm } from './ChoreoLessonForm'
import { useLessons } from '../../hooks/useLessons'
import type { LessonType } from '../../types'

interface AddLessonModalProps {
  date: string
  onClose: () => void
}

export function AddLessonModal({ date, onClose }: AddLessonModalProps) {
  const [lessonType, setLessonType] = useState<LessonType>('time')
  const { addTimeLesson, addChoreoLesson } = useLessons()

  return (
    <Modal title="레슨 추가" onClose={onClose}>
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

      {lessonType === 'time' ? (
        <TimeLessonForm
          date={date}
          onSubmit={(data) => {
            addTimeLesson(data)
            onClose()
          }}
          onCancel={onClose}
        />
      ) : (
        <ChoreoLessonForm
          date={date}
          onSubmit={(data) => {
            addChoreoLesson(data)
            onClose()
          }}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}
