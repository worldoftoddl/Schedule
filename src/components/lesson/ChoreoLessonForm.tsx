import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { formatCurrency, calcTimes } from '../../utils/format'
import type { ChoreoLesson, Choreography } from '../../types'

interface ChoreoLessonFormProps {
  date: string
  editLesson?: ChoreoLesson
  onSubmit: (data: {
    date: string
    startTime: string
    endTime: string
    durationHours: number
    studentId: string
    choreoId: string
    levelId: string
    price: number
    memo?: string
    recurring: boolean
    newChoreo?: { title: string; totalHours: number }
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

export function ChoreoLessonForm({ date, editLesson, onSubmit, onCancel }: ChoreoLessonFormProps) {
  const [startTime, setStartTime] = useState(editLesson?.startTime ?? '10:00')
  const [endTime, setEndTime] = useState(editLesson?.endTime ?? '11:00')
  const [teamId, setTeamId] = useState('')
  const [studentId, setStudentId] = useState(editLesson?.studentId ?? '')
  const [levelId, setLevelId] = useState(editLesson?.levelId ?? '')
  const [choreoId, setChoreoId] = useState(editLesson?.choreoId ?? '')
  const [newChoreoTitle, setNewChoreoTitle] = useState('')
  const [newChoreoHours, setNewChoreoHours] = useState('5')
  const [isNewChoreo, setIsNewChoreo] = useState(false)
  const [memo, setMemo] = useState(editLesson?.memo ?? '')
  const [recurring, setRecurring] = useState(false)

  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray())
  const allStudents = useLiveQuery(() => db.students.orderBy('name').toArray())
  const students = teamId ? allStudents?.filter((s) => s.teamId === teamId) : allStudents
  const levels = useLiveQuery(() => db.choreoLevels.orderBy('sortOrder').toArray())
  const choreographies = useLiveQuery(
    () => studentId
      ? db.choreographies.where('studentId').equals(studentId).toArray()
      : Promise.resolve([] as Choreography[]),
    [studentId]
  )

  const activeChoreographies = choreographies?.filter((c) => c.status === 'in_progress') ?? []

  // Auto-select existing choreography or switch to new mode
  useEffect(() => {
    if (activeChoreographies.length > 0 && !isNewChoreo) {
      const choreo = activeChoreographies[0]
      setChoreoId(choreo.id)
      setLevelId(choreo.levelId)
    } else if (activeChoreographies.length === 0 && studentId) {
      setIsNewChoreo(true)
      setChoreoId('')
    }
  }, [studentId, activeChoreographies.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoreoChange = (id: string) => {
    setChoreoId(id)
    const choreo = activeChoreographies.find((c) => c.id === id)
    if (choreo) {
      setLevelId(choreo.levelId)
    }
  }

  const selectedLevel = levels?.find((l) => l.id === levelId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !levelId) return
    if (!isNewChoreo && !choreoId) return
    if (isNewChoreo && !newChoreoTitle.trim()) return

    onSubmit({
      date,
      startTime,
      endTime,
      durationHours: calcTimes(startTime, endTime),
      studentId,
      choreoId: choreoId || '',
      levelId,
      price: selectedLevel?.price ?? 0,
      memo: memo.trim() || undefined,
      recurring,
      newChoreo: isNewChoreo ? { title: newChoreoTitle.trim(), totalHours: Number(newChoreoHours) || 5 } : undefined,
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
              if (endTime < minEnd) setEndTime(minEnd)
            }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
          <input
            type="time"
            value={endTime}
            min={addMinutes(startTime, 5)}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">팀</label>
        <select
          value={teamId}
          onChange={(e) => { setTeamId(e.target.value); setStudentId(''); setChoreoId(''); setIsNewChoreo(false) }}
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
          선수 <span className="text-red-400">*</span>
        </label>
        <select
          value={studentId}
          onChange={(e) => { setStudentId(e.target.value); setChoreoId(''); setIsNewChoreo(false) }}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          required
        >
          <option value="">선수 선택</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {studentId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">안무</label>
          {activeChoreographies.length > 0 && !isNewChoreo ? (
            <div className="flex flex-col gap-2">
              <select
                value={choreoId}
                onChange={(e) => handleChoreoChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                {activeChoreographies.map((c) => {
                  const lvl = levels?.find((l) => l.id === c.levelId)
                  return (
                    <option key={c.id} value={c.id}>{c.title} ({lvl?.name ?? ''})</option>
                  )
                })}
              </select>
              <button
                type="button"
                onClick={() => { setIsNewChoreo(true); setChoreoId('') }}
                className="text-sm text-indigo-500 text-left hover:underline"
              >
                + 새 안무 만들기
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newChoreoTitle}
                onChange={(e) => setNewChoreoTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="안무 제목 (예: Hype Boy)"
                required
              />
              <div>
                <label className="block text-xs text-gray-500 mb-1">총 타임 수</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={newChoreoHours}
                  onChange={(e) => setNewChoreoHours(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="5"
                  min="1"
                />
              </div>
              {activeChoreographies.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setIsNewChoreo(false); setChoreoId(activeChoreographies[0].id) }}
                  className="text-sm text-gray-500 text-left hover:underline"
                >
                  기존 안무 선택
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          레벨 <span className="text-red-400">*</span>
        </label>
        {choreoId && !isNewChoreo ? (
          <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
            {selectedLevel?.name ?? ''} — {formatCurrency(selectedLevel?.price ?? 0)}
          </div>
        ) : (
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            required
          >
            <option value="">레벨 선택</option>
            {levels?.map((l) => (
              <option key={l.id} value={l.id}>{l.name} — {formatCurrency(l.price)}</option>
            ))}
          </select>
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
        <span className="text-sm text-gray-700">
          {editLesson?.recurringGroupId ? '연동 레슨 모두 수정' : '이번 달 매주 반복'}
        </span>
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
          disabled={!studentId || !levelId || (!choreoId && !newChoreoTitle.trim())}
          className="flex-1 py-2.5 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300 min-h-[44px]"
        >
          {editLesson ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}
