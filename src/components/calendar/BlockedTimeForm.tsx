import { useState } from 'react'
import { getDateKey } from '../../utils/format'
import { endOfMonth } from 'date-fns'

interface BlockedTimeFormProps {
  date: string
  defaultStartTime?: string
  onSubmit: (data: {
    date: string
    startTime: string
    endTime: string
    label: string
    recurring: boolean
    recurringUntil?: string
  }) => void
  onCancel: () => void
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.min(Math.floor(total / 60), 23)
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

export function BlockedTimeForm({ date, defaultStartTime, onSubmit, onCancel }: BlockedTimeFormProps) {
  const [startTime, setStartTime] = useState(defaultStartTime ?? '12:00')
  const [endTime, setEndTime] = useState(addMinutes(defaultStartTime ?? '12:00', 60))
  const [label, setLabel] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [recurringUntil, setRecurringUntil] = useState(() => {
    const [y, m] = date.split('-').map(Number)
    return getDateKey(endOfMonth(new Date(y, m - 1, 1)))
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    onSubmit({
      date,
      startTime,
      endTime,
      label: label.trim(),
      recurring,
      recurringUntil: recurring ? recurringUntil : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value)
              const minEnd = addMinutes(e.target.value, 30)
              if (endTime !== '00:00' && endTime < minEnd) setEndTime(minEnd)
            }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="예: 점심, 이동, 개인 연습"
          required
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-gray-600 focus:ring-gray-400"
        />
        <span className="text-sm text-gray-700">매주 반복</span>
      </label>
      {recurring && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">반복 종료일</label>
          <input
            type="date"
            value={recurringUntil}
            min={date}
            onChange={(e) => setRecurringUntil(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      )}

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
          disabled={!label.trim()}
          className="flex-1 py-2.5 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300 min-h-[44px]"
        >
          추가
        </button>
      </div>
    </form>
  )
}
