import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { splitPrice, formatCurrency, calcTimes, calcStudentPrice, getDateKey } from '../../utils/format'
import { endOfMonth } from 'date-fns'
import type { TimeLesson } from '../../types'

interface TimeLessonFormProps {
  date: string
  editLesson?: TimeLesson
  onSubmit: (data: {
    date: string
    startTime: string
    endTime: string
    durationHours: number
    baseDuration: number
    totalPrice: number
    studentIds: string[]
    studentAllocations?: Record<string, number>
    memo?: string
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

export function TimeLessonForm({ date, editLesson, onSubmit, onCancel }: TimeLessonFormProps) {
  const [startTime, setStartTime] = useState(editLesson?.startTime ?? '10:00')
  const [endTime, setEndTime] = useState(editLesson?.endTime ?? '11:00')
  const [levelId, setLevelId] = useState('')
  const [totalPrice, setTotalPrice] = useState(editLesson ? String(editLesson.totalPrice) : '')
  const [teamId, setTeamId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(editLesson?.studentIds ?? [])
  const [memo, setMemo] = useState(editLesson?.memo ?? '')
  const [useAllocation, setUseAllocation] = useState(() => !!editLesson?.studentAllocations)
  const [allocations, setAllocations] = useState<Record<string, string>>(() => {
    if (editLesson?.studentAllocations) {
      const m: Record<string, string> = {}
      for (const [k, v] of Object.entries(editLesson.studentAllocations)) {
        m[k] = String(v)
      }
      return m
    }
    return {}
  })
  const [recurring, setRecurring] = useState(false)
  const [recurringUntil, setRecurringUntil] = useState(() => {
    const [y, m] = date.split('-').map(Number)
    return getDateKey(endOfMonth(new Date(y, m - 1, 1)))
  })

  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray())
  const students = useLiveQuery(() => db.students.orderBy('name').toArray())
  const timeLevels = useLiveQuery(() => db.timeLessonLevels.orderBy('sortOrder').toArray())

  // 수정 모드: 선수의 teamId로 팀 필터 복원
  useEffect(() => {
    if (editLesson && students && students.length > 0 && !teamId) {
      const firstStudentId = editLesson.studentIds[0]
      if (firstStudentId) {
        const student = students.find((s) => s.id === firstStudentId)
        if (student?.teamId) {
          setTeamId(student.teamId)
        }
      }
    }
  }, [editLesson, students]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStudents = teamId
    ? students?.filter((s) => s.teamId === teamId)
    : students

  const handleLevelChange = (id: string) => {
    setLevelId(id)
    const level = timeLevels?.find((l) => l.id === id)
    if (level) {
      setTotalPrice(String(level.pricePerHour))
    }
  }

  const price = Number(totalPrice) || 0
  const perStudent = splitPrice(price, selectedStudentIds.length)

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!editLesson && !levelId) || price <= 0) return
    const selectedLevel = timeLevels?.find((l) => l.id === levelId)
    const baseDur = editLesson?.baseDuration ?? selectedLevel?.baseDuration ?? 60
    let studentAllocations: Record<string, number> | undefined
    if (useAllocation && selectedStudentIds.length >= 2) {
      studentAllocations = {}
      for (const sid of selectedStudentIds) {
        studentAllocations[sid] = Number(allocations[sid]) || 0
      }
    }
    onSubmit({
      date,
      startTime,
      endTime,
      durationHours: calcTimes(startTime, endTime),
      baseDuration: baseDur,
      totalPrice: price,
      studentIds: selectedStudentIds,
      studentAllocations,
      memo: memo.trim() || undefined,
      recurring,
      recurringUntil: recurring ? recurringUntil : undefined,
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
            onChange={(e) => {
              const val = e.target.value
              setStartTime(val)
              const minEnd = addMinutes(val, 5)
              // 00:00(자정)은 유효한 종료시간이므로 건너뜀
              if (endTime !== '00:00' && endTime < minEnd) setEndTime(minEnd)
            }}
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
          {editLesson ? '레슨비 (원)' : '레슨 항목'} <span className="text-red-400">*</span>
        </label>
        {editLesson ? (
          <input
            type="number"
            inputMode="numeric"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        ) : (
          <select
            value={levelId}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            required
          >
            <option value="">항목 선택</option>
            {timeLevels?.map((l) => (
              <option key={l.id} value={l.id}>{l.name} — {l.baseDuration}분 {formatCurrency(l.pricePerHour)}</option>
            ))}
          </select>
        )}
        {selectedStudentIds.length > 1 && price > 0 && !useAllocation && (
          <p className="text-xs text-indigo-500 mt-1">
            1인당 {formatCurrency(perStudent)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">팀</label>
        <select
          value={teamId}
          onChange={(e) => { setTeamId(e.target.value); setSelectedStudentIds([]) }}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">전체</option>
          {teams?.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          선수 선택
        </label>
        {(!filteredStudents || filteredStudents.length === 0) ? (
          <p className="text-sm text-gray-400">먼저 선수를 추가해 주세요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredStudents.map((s) => (
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

      {selectedStudentIds.length >= 2 && price > 0 && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={useAllocation}
              onChange={(e) => {
                setUseAllocation(e.target.checked)
                if (e.target.checked && Object.keys(allocations).length === 0) {
                  // 기본값: 총 수업시간을 균등 분배
                  const totalMin = calcTimes(startTime, endTime) * 60
                  const perMin = Math.round(totalMin / selectedStudentIds.length)
                  const init: Record<string, string> = {}
                  for (const sid of selectedStudentIds) init[sid] = String(perMin)
                  setAllocations(init)
                }
              }}
              className="w-5 h-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
            />
            <span className="text-sm text-gray-700">선수별 시간 배분</span>
          </label>
          {useAllocation && (
            <div className="flex flex-col gap-2 pl-1">
              {selectedStudentIds.map((sid) => {
                const student = students?.find((s) => s.id === sid)
                const mins = Number(allocations[sid]) || 0
                const baseDur = editLesson?.baseDuration ?? timeLevels?.find((l) => l.id === levelId)?.baseDuration ?? 60
                const studentPrice = calcStudentPrice(mins, baseDur, price)
                return (
                  <div key={sid} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-16 truncate">{student?.name ?? sid}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={allocations[sid] ?? ''}
                      onChange={(e) => setAllocations((prev) => ({ ...prev, [sid]: e.target.value }))}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="분"
                      min={0}
                    />
                    <span className="text-xs text-gray-500">분</span>
                    <span className="text-xs text-indigo-500 ml-auto">{formatCurrency(studentPrice)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
        <span className="text-sm text-gray-700">
          {editLesson?.recurringGroupId ? '연동 레슨 모두 수정' : '매주 반복'}
        </span>
      </label>
      {recurring && !editLesson?.recurringGroupId && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">반복 종료일</label>
          <input
            type="date"
            value={recurringUntil}
            min={date}
            onChange={(e) => setRecurringUntil(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          disabled={(!editLesson && !levelId) || price <= 0}
          className="flex-1 py-2.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-300 min-h-[44px]"
        >
          {editLesson ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}
