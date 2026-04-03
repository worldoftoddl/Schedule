import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useCalendarStore } from '../../stores/useCalendarStore'
import { useBlockedTimes } from '../../hooks/useBlockedTimes'
import { getWeekDates, buildDayTimeline, calcDaySummary } from '../../utils/availability'
import { TimeSlot } from './TimeSlot'
import { BlockedTimeForm } from './BlockedTimeForm'
import { Modal } from '../ui/Modal'
import type { TimeSlotData } from '../../types'

const DAY_START = '06:00'
const DAY_END = '23:00'
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6~22

export function WeeklyTimeline() {
  const { year, month, weekIndex, selectDate, setViewMode } = useCalendarStore()
  const { addBlockedTime } = useBlockedTimes()
  const [showBlockForm, setShowBlockForm] = useState<{ date: string; startTime?: string } | null>(null)

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

  if (!timeLessons || !choreoLessons || !blockedTimes) return null

  // Build timeline for each day
  const dayTimelines: { date: string; slots: TimeSlotData[] }[] = weekDates.map((date) => {
    const dayTimeLessons = timeLessons
      .filter((l) => l.date === date)
      .map((l) => ({ startTime: l.startTime, endTime: l.endTime, type: 'time' as const }))
    const dayChoreoLessons = choreoLessons
      .filter((l) => l.date === date)
      .map((l) => ({ startTime: l.startTime, endTime: l.endTime, type: 'choreo' as const }))
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
        {dayTimelines.map(({ date, slots }) => {
          const summary = calcDaySummary(date, slots)
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
              <span className="text-gray-400">{summary.freeSlots > 0 ? `${summary.freeSlots}빈` : ''}</span>
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
                    <TimeSlot status={slot.status} label={slot.label} />
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
                    <TimeSlot status={slot.status} label={slot.label} />
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
    </div>
  )
}
