import { describe, it, expect } from 'vitest'
import { getMonthGrid, getWeekdayDatesInMonth, navigateMonth, WEEKDAY_LABELS } from '../calendar'

describe('getMonthGrid', () => {
  it('returns 7-column aligned grid for April 2026', () => {
    const grid = getMonthGrid(2026, 4)
    // April 2026 starts on Wednesday (3), so grid starts on Sunday (March 29)
    expect(grid.length % 7).toBe(0)
    expect(grid.length).toBeGreaterThanOrEqual(28)
    expect(grid.length).toBeLessThanOrEqual(42)
  })

  it('marks current month days correctly', () => {
    const grid = getMonthGrid(2026, 4)
    const aprilDays = grid.filter((d) => d.isCurrentMonth)
    expect(aprilDays).toHaveLength(30) // April has 30 days
  })

  it('handles February in a non-leap year', () => {
    const grid = getMonthGrid(2027, 2)
    const febDays = grid.filter((d) => d.isCurrentMonth)
    expect(febDays).toHaveLength(28)
  })

  it('handles February in a leap year', () => {
    const grid = getMonthGrid(2028, 2)
    const febDays = grid.filter((d) => d.isCurrentMonth)
    expect(febDays).toHaveLength(29)
  })

  it('dateKey is in YYYY-MM-DD format', () => {
    const grid = getMonthGrid(2026, 4)
    const firstCurrentMonth = grid.find((d) => d.isCurrentMonth)!
    expect(firstCurrentMonth.dateKey).toBe('2026-04-01')
  })
})

describe('getWeekdayDatesInMonth', () => {
  it('returns all Mondays in April 2026', () => {
    // April 2026: Mon = 6, 13, 20, 27
    const mondays = getWeekdayDatesInMonth(2026, 4, 1)
    expect(mondays).toEqual([
      '2026-04-06',
      '2026-04-13',
      '2026-04-20',
      '2026-04-27',
    ])
  })

  it('returns all Sundays in March 2026', () => {
    // March 2026: Sun = 1, 8, 15, 22, 29
    const sundays = getWeekdayDatesInMonth(2026, 3, 0)
    expect(sundays).toEqual([
      '2026-03-01',
      '2026-03-08',
      '2026-03-15',
      '2026-03-22',
      '2026-03-29',
    ])
  })

  it('handles months with 4 occurrences', () => {
    const result = getWeekdayDatesInMonth(2026, 2, 0)
    // Feb 2026: Sun = 1, 8, 15, 22
    expect(result).toHaveLength(4)
  })
})

describe('navigateMonth', () => {
  it('goes to next month', () => {
    expect(navigateMonth(2026, 4, 'next')).toEqual({ year: 2026, month: 5 })
  })

  it('goes to previous month', () => {
    expect(navigateMonth(2026, 4, 'prev')).toEqual({ year: 2026, month: 3 })
  })

  it('wraps year forward', () => {
    expect(navigateMonth(2026, 12, 'next')).toEqual({ year: 2027, month: 1 })
  })

  it('wraps year backward', () => {
    expect(navigateMonth(2026, 1, 'prev')).toEqual({ year: 2025, month: 12 })
  })
})

describe('WEEKDAY_LABELS', () => {
  it('has 7 Korean weekday labels starting with Sunday', () => {
    expect(WEEKDAY_LABELS).toEqual(['일', '월', '화', '수', '목', '금', '토'])
  })
})
