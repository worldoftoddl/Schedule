import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { splitPrice, formatCurrency } from '../../utils/format'

interface TimeLessonFormProps {
  date: string
  onSubmit: (data: {
    date: string
    startTime: string
    endTime: string
    durationHours: number
    totalPrice: number
    studentIds: string[]
    memo?: string
    recurring: boolean
  }) => void
  onCancel: () => void
}

export function TimeLessonForm({ date, onSubmit, onCancel }: TimeLessonFormProps) {
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [levelId, setLevelId] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [memo, setMemo] = useState('')
  const [recurring, setRecurring] = useState(false)

  const students = useLiveQuery(() => db.students.orderBy('name').toArray())
  const timeLevels = useLiveQuery(() => db.timeLessonLevels.orderBy('sortOrder').toArray())

  const handleLevelChange = (id: string) => {
    setLevelId(id)
    const level = timeLevels?.find((l) => l.id === id)
    if (level) {
      setTotalPrice(String(level.pricePerHour))
    }
  }

  const price = Number(totalPrice) || 0
  const perStudent = splitPrice(price, selectedStudentIds.length)

  const calcDuration = () => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStudentIds.length === 0 || !levelId || price <= 0) return
    onSubmit({
      date,
      startTime,
      endTime,
      durationHours: calcDuration(),
      totalPrice: price,
      studentIds: selectedStudentIds,
      memo: memo.trim() || undefined,
      recurring,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          레슨 항목 <span className="text-red-400">*</span>
        </label>
        <select
          value={levelId}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          required
        >
          <option value="">항목 선택</option>
          {timeLevels?.map((l) => (
            <option key={l.id} value={l.id}>{l.name} — {formatCurrency(l.pricePerHour)}/시간</option>
          ))}
        </select>
        {selectedStudentIds.length > 1 && price > 0 && (
          <p className="text-xs text-indigo-500 mt-1">
            1인당 {formatCurrency(perStudent)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          학생 선택 <span className="text-red-400">*</span>
        </label>
        {(!students || students.length === 0) ? (
          <p className="text-sm text-gray-400">먼저 학생을 추가해 주세요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStudent(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedStudentIds.includes(s.id)
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="메모 (선택)"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
        />
        <span className="text-sm text-gray-700">이번 달 매주 반복</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={selectedStudentIds.length === 0 || !levelId || price <= 0}
          className="flex-1 py-2.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-300 min-h-[44px]"
        >
          추가
        </button>
      </div>
    </form>
  )
}
