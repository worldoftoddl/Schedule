import { describe, it, expect } from 'vitest'
import { getWeekDates, buildDayTimeline, calcDaySummary } from '../availability'
import type { TimeSlotData } from '../../types'

describe('getWeekDates', () => {
  it('returns 7 dates for a normal week', () => {
    // 2026-04-06 is Monday in the first full week of April
    const dates = getWeekDates(2026, 4, 1)
    expect(dates).toHaveLength(7)
  })

  it('returns dates starting from Sunday (weekStartsOn=0)', () => {
    // 2026-04 week 0 starts on Sun March 29 (grid start)
    const dates = getWeekDates(2026, 4, 0)
    expect(dates).toHaveLength(7)
    // First date should be a Sunday
    const day = new Date(dates[0]).getDay()
    expect(day).toBe(0) // Sunday
  })

  it('handles month boundary (first week may include prev month dates)', () => {
    const dates = getWeekDates(2026, 4, 0)
    // April 2026 starts on Wednesday, so week 0 starts Sun Mar 29
    expect(dates[0]).toBe('2026-03-29')
    expect(dates[3]).toBe('2026-04-01') // Wednesday
  })

  it('handles last week of month (may include next month dates)', () => {
    // April 2026 ends on Thursday 4/30, last week includes May dates
    const dates = getWeekDates(2026, 4, 4)
    expect(dates[dates.length - 1]).toBe('2026-05-02') // Saturday
  })

  it('returns correct week count for the month', () => {
    // April 2026: Sun 3/29 ~ Sat 5/2 = 5 weeks
    for (let i = 0; i < 5; i++) {
      const dates = getWeekDates(2026, 4, i)
      expect(dates).toHaveLength(7)
    }
  })
})

describe('buildDayTimeline', () => {
  const DAY_START = '06:00'
  const DAY_END = '23:00'
  const TOTAL_SLOTS = 34 // (23-6)*2 = 34 half-hour slots

  it('returns all free slots when no lessons or blocks', () => {
    const slots = buildDayTimeline([], [], DAY_START, DAY_END)
    expect(slots).toHaveLength(TOTAL_SLOTS)
    expect(slots.every((s) => s.status === 'free')).toBe(true)
  })

  it('marks time lesson slots correctly', () => {
    const lessons = [{ startTime: '10:00', endTime: '11:00', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const occupied = slots.filter((s) => s.status === 'time')
    expect(occupied).toHaveLength(2) // 10:00, 10:30
    expect(occupied[0].time).toBe('10:00')
    expect(occupied[1].time).toBe('10:30')
  })

  it('marks choreo lesson slots correctly', () => {
    const lessons = [{ startTime: '14:00', endTime: '15:00', type: 'choreo' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const occupied = slots.filter((s) => s.status === 'choreo')
    expect(occupied).toHaveLength(2) // 14:00, 14:30
  })

  it('marks blocked time slots correctly', () => {
    const blocks = [{ startTime: '12:00', endTime: '13:00', label: '점심' }]
    const slots = buildDayTimeline([], blocks, DAY_START, DAY_END)
    const blocked = slots.filter((s) => s.status === 'blocked')
    expect(blocked).toHaveLength(2)
    expect(blocked[0].label).toBe('점심')
  })

  it('handles overlap between lesson types', () => {
    const lessons = [
      { startTime: '10:00', endTime: '11:00', type: 'time' as const },
      { startTime: '10:30', endTime: '11:30', type: 'choreo' as const },
    ]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    // 10:00 = time only, 10:30 = overlap, 11:00 = choreo only
    expect(slots.find((s) => s.time === '10:00')?.status).toBe('time')
    expect(slots.find((s) => s.time === '10:30')?.status).toBe('overlap')
    expect(slots.find((s) => s.time === '11:00')?.status).toBe('choreo')
  })

  it('handles 50-minute lesson (occupies partial slot)', () => {
    // 10:00~10:50 should occupy 10:00 and 10:30 (any overlap counts)
    const lessons = [{ startTime: '10:00', endTime: '10:50', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const occupied = slots.filter((s) => s.status === 'time')
    expect(occupied).toHaveLength(2)
    expect(occupied[0].time).toBe('10:00')
    expect(occupied[1].time).toBe('10:30')
  })

  it('ignores lessons outside day range', () => {
    const lessons = [{ startTime: '05:00', endTime: '05:50', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    expect(slots.every((s) => s.status === 'free')).toBe(true)
  })

  it('handles lesson at day boundary', () => {
    const lessons = [{ startTime: '22:00', endTime: '23:00', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const occupied = slots.filter((s) => s.status === 'time')
    expect(occupied).toHaveLength(2)
    expect(occupied[0].time).toBe('22:00')
    expect(occupied[1].time).toBe('22:30')
  })

  it('handles midnight-crossing lesson (22:00~00:00)', () => {
    const lessons = [{ startTime: '22:00', endTime: '00:00', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, '24:00')
    const occupied = slots.filter((s) => s.status === 'time')
    // 22:00, 22:30, 23:00, 23:30 = 4 slots
    expect(occupied).toHaveLength(4)
    expect(occupied[0].time).toBe('22:00')
    expect(occupied[3].time).toBe('23:30')
  })

  it('handles midnight-crossing blocked time', () => {
    const blocks = [{ startTime: '23:00', endTime: '00:00', label: '정리' }]
    const slots = buildDayTimeline([], blocks, DAY_START, '24:00')
    const blocked = slots.filter((s) => s.status === 'blocked')
    expect(blocked).toHaveLength(2) // 23:00, 23:30
  })

  it('handles blocked + lesson overlap as overlap', () => {
    const lessons = [{ startTime: '12:00', endTime: '13:00', type: 'time' as const }]
    const blocks = [{ startTime: '12:00', endTime: '13:00', label: '점심' }]
    const slots = buildDayTimeline(lessons, blocks, DAY_START, DAY_END)
    expect(slots.find((s) => s.time === '12:00')?.status).toBe('overlap')
    expect(slots.find((s) => s.time === '12:30')?.status).toBe('overlap')
  })
})

describe('buildDayTimeline lessonMeta', () => {
  const DAY_START = '06:00'
  const DAY_END = '23:00'

  it('attaches lessonMeta with isStart on first slot', () => {
    const lessons = [{
      startTime: '10:00', endTime: '11:00', type: 'time' as const,
      lessonId: 'L1', displayLabel: '주니',
    }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const s1 = slots.find((s) => s.time === '10:00')!
    const s2 = slots.find((s) => s.time === '10:30')!

    expect(s1.lessonMeta).toBeDefined()
    expect(s1.lessonMeta!.isStart).toBe(true)
    expect(s1.lessonMeta!.isContinuation).toBe(false)
    expect(s1.lessonMeta!.displayLabel).toBe('주니')
    expect(s1.lessonMeta!.lessonId).toBe('L1')

    expect(s2.lessonMeta).toBeDefined()
    expect(s2.lessonMeta!.isStart).toBe(false)
    expect(s2.lessonMeta!.isContinuation).toBe(true)
  })

  it('does not attach lessonMeta to free slots', () => {
    const lessons = [{
      startTime: '10:00', endTime: '10:30', type: 'time' as const,
      lessonId: 'L1', displayLabel: '주니',
    }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const free = slots.find((s) => s.time === '10:30')!
    expect(free.status).toBe('free')
    expect(free.lessonMeta).toBeUndefined()
  })

  it('works without lessonId/displayLabel (backward compat)', () => {
    // Lessons without meta fields should still work (no lessonMeta on slots)
    const lessons = [{ startTime: '10:00', endTime: '11:00', type: 'time' as const }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const s1 = slots.find((s) => s.time === '10:00')!
    expect(s1.status).toBe('time')
    expect(s1.lessonMeta).toBeUndefined()
  })

  it('handles choreo lesson meta', () => {
    const lessons = [{
      startTime: '14:00', endTime: '15:00', type: 'choreo' as const,
      lessonId: 'C1', displayLabel: '시니',
    }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const s1 = slots.find((s) => s.time === '14:00')!
    expect(s1.lessonMeta!.type).toBe('choreo')
    expect(s1.lessonMeta!.displayLabel).toBe('시니')
  })

  it('picks first lesson meta on overlap', () => {
    const lessons = [
      { startTime: '10:00', endTime: '11:00', type: 'time' as const, lessonId: 'L1', displayLabel: '주니' },
      { startTime: '10:30', endTime: '11:30', type: 'choreo' as const, lessonId: 'C1', displayLabel: '시니' },
    ]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const overlap = slots.find((s) => s.time === '10:30')!
    expect(overlap.status).toBe('overlap')
    // First matching lesson's meta
    expect(overlap.lessonMeta).toBeDefined()
    expect(overlap.lessonMeta!.lessonId).toBe('L1')
  })

  it('3-slot lesson has correct isStart/isContinuation', () => {
    const lessons = [{
      startTime: '10:00', endTime: '11:30', type: 'time' as const,
      lessonId: 'L1', displayLabel: '주니',
    }]
    const slots = buildDayTimeline(lessons, [], DAY_START, DAY_END)
    const s0 = slots.find((s) => s.time === '10:00')!
    const s1 = slots.find((s) => s.time === '10:30')!
    const s2 = slots.find((s) => s.time === '11:00')!

    expect(s0.lessonMeta!.isStart).toBe(true)
    expect(s0.lessonMeta!.isContinuation).toBe(false)
    expect(s1.lessonMeta!.isStart).toBe(false)
    expect(s1.lessonMeta!.isContinuation).toBe(true)
    expect(s2.lessonMeta!.isStart).toBe(false)
    expect(s2.lessonMeta!.isContinuation).toBe(true)
  })
})

describe('calcDaySummary', () => {
  it('counts all free when no lessons', () => {
    const slots: TimeSlotData[] = Array.from({ length: 10 }, (_, i) => ({
      time: `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
      status: 'free' as const,
    }))
    const summary = calcDaySummary('2026-04-06', slots)
    expect(summary.freeSlots).toBe(10)
    expect(summary.lessonSlots).toBe(0)
  })

  it('counts lessons and free correctly', () => {
    const slots: TimeSlotData[] = [
      { time: '10:00', status: 'time' },
      { time: '10:30', status: 'time' },
      { time: '11:00', status: 'free' },
      { time: '11:30', status: 'choreo' },
      { time: '12:00', status: 'blocked' },
      { time: '12:30', status: 'free' },
      { time: '13:00', status: 'overlap' },
    ]
    const summary = calcDaySummary('2026-04-06', slots)
    expect(summary.lessonSlots).toBe(4) // time*2 + choreo + overlap
    expect(summary.freeSlots).toBe(2) // free*2 (blocked not free)
  })

  it('treats blocked as neither lesson nor free', () => {
    const slots: TimeSlotData[] = [
      { time: '12:00', status: 'blocked' },
      { time: '12:30', status: 'blocked' },
    ]
    const summary = calcDaySummary('2026-04-06', slots)
    expect(summary.lessonSlots).toBe(0)
    expect(summary.freeSlots).toBe(0)
  })
})
