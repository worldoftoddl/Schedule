import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useBlockedTimes } from '../../hooks/useBlockedTimes'
import { getWeekDates, buildDayTimeline } from '../../utils/availability'
import { TimeSlot } from './TimeSlot'
import { BlockedTimeForm } from './BlockedTimeForm'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { BlockedTime, TimeSlotData } from '../../types'

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const DAY_START = '06:00'
const DAY_END = '24:00'
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6~23

export function WeeklyTimeline() {
  const { year, month, weekIndex, selectDate, setViewMode } = useCalendarStore()
  const { addBlockedTime, deleteBlockedTime } = useBlockedTimes()
  const [showBlockForm, setShowBlockForm] = useState<{ date: string; startTime?: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlockedTime | null>(null)

  const weekDates = getWeekDates(year, month, weekIndex)

  const timeLessons = useLiveQuery(
    () => db.timeLessons.where('date').anyOf(weekDates).toArray(),
    [weekDates.join(',')]
  )

  const choreoLessons = useLiveQuery(
    () => db.choreoLessons.where('date').anyOf(weekDates).toArray(),
    [weekDates.join(',')]
  )

  const blockedTimes = useLiveQuery(
    () => db.blockedTimes.where('date').anyOf(weekDates).toArray(),
    [weekDates.join(',')]
  )

  const students = useLiveQuery(() => db.students.toArray(), [])
  const teams = useLiveQuery(() => db.teams.toArray(), [])

  // studentId → 팀명 축약 (2글자) 매핑
  const labelByStudentId = useMemo(() => {
    if (!students || !teams) return new Map<string, string>()
    const teamMap = new Map(teams.map((t) => [t.id, t.name]))
    return new Map(students.map((s) => [
      s.id,
      s.teamId ? (teamMap.get(s.teamId)?.slice(0, 2) ?? s.name.slice(0, 2)) : s.name.slice(0, 2),
    ]))
  }, [students, teams])

  if (!timeLessons || !choreoLessons || !blockedTimes || !students || !teams) return null

  // Build timeline for each day
  const dayTimelines: { date: string; slots: TimeSlotData[] }[] = weekDates.map((date) => {
    const dayTimeLessons = timeLessons
      .filter((l) => l.date === date)
      .map((l) => {
        const firstStudentId = l.studentIds[0]
        const label = firstStudentId ? labelByStudentId.get(firstStudentId) ?? '' : ''
        return {
          startTime: l.startTime, endTime: l.endTime, type: 'time' as const,
          lessonId: l.id, displayLabel: label,
        }
      })
    const dayChoreoLessons = choreoLessons
      .filter((l) => l.date === date)
      .map((l) => ({
        startTime: l.startTime, endTime: l.endTime, type: 'choreo' as const,
        lessonId: l.id, displayLabel: labelByStudentId.get(l.studentId) ?? '',
      }))
    const dayBlocks = blockedTimes
      .filter((b) => b.date === date)
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime, label: b.label }))

    const slots = buildDayTimeline(
      [...dayTimeLessons, ...dayChoreoLessons],
      dayBlocks,
      DAY_START,
      DAY_END,
    )
    return { date, slots }
  })

  const handleDrillDown = (dateKey: string) => {
    selectDate(dateKey)
    setViewMode('monthly')
  }

  const handleSlotClick = (date: string, slotTime: string, status: string) => {
    if (status === 'free') {
      setShowBlockForm({ date, startTime: slotTime })
    } else if (status === 'blocked') {
      // Find the blocked time that covers this slot
      const slotMin = timeToMin(slotTime)
      const block = blockedTimes.find((b) => {
        if (b.date !== date) return false
        const bs = timeToMin(b.startTime)
        let be = timeToMin(b.endTime)
        if (be <= bs && be === 0) be = 1440
        return bs <= slotMin && be > slotMin
      })
      if (block) setDeleteTarget(block)
    }
  }

  const handleAddBlock = async (data: Parameters<typeof addBlockedTime>[0]) => {
    await addBlockedTime(data)
    setShowBlockForm(null)
  }

  // Week range label
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const formatShort = (d: string) => {
    const [, m, day] = d.split('-')
    return `${Number(m)}/${Number(day)}`
  }

  return (
    <div className="flex flex-col">
      {/* Week range header */}
      <div className="text-center text-xs text-gray-500 py-1.5 border-b border-gray-100">
        {formatShort(weekStart)} ~ {formatShort(weekEnd)}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 py-1.5 text-[10px] text-gray-500 border-b border-gray-100">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" /> 타임</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-pink-400 inline-block" /> 안무</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" /> 블록</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-50 border border-gray-200 inline-block" /> 빈 시간</span>
      </div>

      {/* Day summaries */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-gray-200">
        <div /> {/* spacer for time labels */}
        {dayTimelines.map(({ date }) => {
          const dayOfWeek = new Date(date).getDay()
          const [, , d] = date.split('-')
          return (
            <button
              key={date}
              onClick={() => handleDrillDown(date)}
              className={`flex flex-col items-center py-1 text-[10px] leading-tight hover:bg-gray-50 ${
                dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-600'
              }`}
            >
              <span className="font-medium">{DAY_LABELS[dayOfWeek]}</span>
              <span>{Number(d)}</span>
            </button>
          )
        })}
      </div>

      {/* Timeline grid */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 220px)' }}>
        <div className="grid grid-cols-[40px_repeat(7,1fr)]">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              {/* Time label (spans 2 rows = 1 hour) */}
              <div className="row-span-2 flex items-start justify-end pr-1 text-[10px] text-gray-400 border-r border-gray-100 h-12">
                <span className="-mt-1">{hour}</span>
              </div>
              {/* First 30-min row */}
              {dayTimelines.map(({ date, slots }) => {
                const slotIdx = (hour - 6) * 2
                const slot = slots[slotIdx]
                if (!slot) return <div key={`${date}-${hour}-0`} />
                return (
                  <div
                    key={`${date}-${hour}-0`}
                    onClick={() => handleSlotClick(date, slot.time, slot.status)}
                    className="cursor-pointer"
                  >
                    <TimeSlot status={slot.status} label={slot.label} lessonMeta={slot.lessonMeta} />
                  </div>
                )
              })}
              {/* Second 30-min row */}
              {dayTimelines.map(({ date, slots }) => {
                const slotIdx = (hour - 6) * 2 + 1
                const slot = slots[slotIdx]
                if (!slot) return <div key={`${date}-${hour}-1`} />
                return (
                  <div
                    key={`${date}-${hour}-1`}
                    onClick={() => handleSlotClick(date, slot.time, slot.status)}
                    className="cursor-pointer"
                  >
                    <TimeSlot status={slot.status} label={slot.label} lessonMeta={slot.lessonMeta} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked time form modal */}
      {showBlockForm && (
        <Modal title="블록 시간 추가" onClose={() => setShowBlockForm(null)}>
          <BlockedTimeForm
            date={showBlockForm.date}
            defaultStartTime={showBlockForm.startTime}
            onSubmit={handleAddBlock}
            onCancel={() => setShowBlockForm(null)}
          />
        </Modal>
      )}

      {/* Delete blocked time confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="블록 시간 삭제"
          message={`"${deleteTarget.label}" (${deleteTarget.startTime}~${deleteTarget.endTime})을 삭제할까요?${deleteTarget.recurringGroupId ? '\n\n반복된 블록을 모두 삭제하려면 "모두 삭제"를 선택하세요.' : ''}`}
          confirmLabel={deleteTarget.recurringGroupId ? '이것만 삭제' : '삭제'}
          onConfirm={async () => {
            await deleteBlockedTime(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          extraAction={deleteTarget.recurringGroupId ? {
            label: '모두 삭제',
            onClick: async () => {
              await deleteBlockedTime(deleteTarget.id, true)
              setDeleteTarget(null)
            },
          } : undefined}
        />
      )}
    </div>
  )
}
