import { getMonthGrid } from './calendar'
import type { TimeSlotData, SlotStatus, DaySummary, LessonSlotMeta } from '../types'

export interface LessonSlice {
  startTime: string
  endTime: string
  type: 'time' | 'choreo'
  lessonId?: string
  displayLabel?: string
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

  let prevLessonId: string | undefined

  for (let m = startMin; m < endMin; m += 30) {
    const slotStart = m
    const slotEnd = m + 30
    const time = minutesToTime(m)

    let hasTime = false
    let hasChoreo = false
    let hasBlock = false
    let blockLabel: string | undefined
    let firstMatch: LessonSlice | undefined

    for (const l of lessons) {
      const ls = timeToMinutes(l.startTime)
      const le = timeToMinutes(l.endTime)
      if (ls < slotEnd && le > slotStart) {
        if (l.type === 'time') hasTime = true
        else hasChoreo = true
        if (!firstMatch) firstMatch = l
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

    // Build lessonMeta only if we have a matching lesson with id
    let lessonMeta: LessonSlotMeta | undefined
    if (firstMatch?.lessonId) {
      const isStart = timeToMinutes(firstMatch.startTime) >= slotStart &&
                      timeToMinutes(firstMatch.startTime) < slotEnd
      lessonMeta = {
        lessonId: firstMatch.lessonId,
        type: firstMatch.type,
        displayLabel: firstMatch.displayLabel ?? '',
        startTime: firstMatch.startTime,
        endTime: firstMatch.endTime,
        isStart,
        isContinuation: !isStart && prevLessonId === firstMatch.lessonId,
      }
    }

    prevLessonId = firstMatch?.lessonId

    slots.push({
      time,
      status,
      label: hasBlock ? blockLabel : undefined,
      lessonMeta,
    })
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
