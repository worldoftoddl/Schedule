import { getMonthGrid } from './calendar'
import type { TimeSlotData, SlotStatus, DaySummary } from '../types'

interface LessonSlice {
  startTime: string
  endTime: string
  type: 'time' | 'choreo'
}

interface BlockSlice {
  startTime: string
  endTime: string
  label: string
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Get 7 dates (Sun~Sat) for the Nth week of the month grid.
 */
export function getWeekDates(year: number, month: number, weekIndex: number): string[] {
  const grid = getMonthGrid(year, month)
  const start = weekIndex * 7
  return grid.slice(start, start + 7).map((d) => d.dateKey)
}

/**
 * Build 30-min slot timeline for a single day.
 * Any overlap ≥1 minute between a slot and a lesson/block counts as occupied.
 */
export function buildDayTimeline(
  lessons: LessonSlice[],
  blocks: BlockSlice[],
  dayStart: string,
  dayEnd: string,
): TimeSlotData[] {
  const startMin = timeToMinutes(dayStart)
  const endMin = timeToMinutes(dayEnd)
  const slots: TimeSlotData[] = []

  for (let m = startMin; m < endMin; m += 30) {
    const slotStart = m
    const slotEnd = m + 30
    const time = minutesToTime(m)

    let hasTime = false
    let hasChoreo = false
    let hasBlock = false
    let blockLabel: string | undefined

    for (const l of lessons) {
      const ls = timeToMinutes(l.startTime)
      const le = timeToMinutes(l.endTime)
      if (ls < slotEnd && le > slotStart) {
        if (l.type === 'time') hasTime = true
        else hasChoreo = true
      }
    }

    for (const b of blocks) {
      const bs = timeToMinutes(b.startTime)
      const be = timeToMinutes(b.endTime)
      if (bs < slotEnd && be > slotStart) {
        hasBlock = true
        blockLabel = b.label
      }
    }

    const occupied = [hasTime, hasChoreo, hasBlock].filter(Boolean).length
    let status: SlotStatus
    if (occupied >= 2) {
      status = 'overlap'
    } else if (hasTime) {
      status = 'time'
    } else if (hasChoreo) {
      status = 'choreo'
    } else if (hasBlock) {
      status = 'blocked'
    } else {
      status = 'free'
    }

    slots.push({ time, status, label: hasBlock ? blockLabel : undefined })
  }

  return slots
}

/**
 * Calculate day summary from slot data.
 * Lesson slots = time + choreo + overlap. Free = free only (blocked excluded).
 */
export function calcDaySummary(date: string, slots: TimeSlotData[]): DaySummary {
  let lessonSlots = 0
  let freeSlots = 0
  for (const s of slots) {
    if (s.status === 'time' || s.status === 'choreo' || s.status === 'overlap') {
      lessonSlots++
    } else if (s.status === 'free') {
      freeSlots++
    }
  }
  return { date, lessonSlots, freeSlots }
}
