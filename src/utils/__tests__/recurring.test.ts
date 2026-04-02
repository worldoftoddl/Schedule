import { describe, it, expect } from 'vitest'
import { expandWeeklyRecurring } from '../recurring'

describe('expandWeeklyRecurring', () => {
  it('expands a Wednesday to all Wednesdays in April 2026', () => {
    // April 1 2026 is Wednesday
    const result = expandWeeklyRecurring('2026-04-01', 2026, 4)
    expect(result.dates).toEqual([
      '2026-04-01',
      '2026-04-08',
      '2026-04-15',
      '2026-04-22',
      '2026-04-29',
    ])
    expect(result.recurringGroupId).toBeTruthy()
  })

  it('generates a unique recurringGroupId', () => {
    const r1 = expandWeeklyRecurring('2026-04-01', 2026, 4)
    const r2 = expandWeeklyRecurring('2026-04-01', 2026, 4)
    expect(r1.recurringGroupId).not.toBe(r2.recurringGroupId)
  })

  it('handles a date expanding into a different month scope', () => {
    // If base date is in March but expanding for April
    // March 30 2026 is Monday → expand all Mondays in April 2026
    const result = expandWeeklyRecurring('2026-03-30', 2026, 4)
    expect(result.dates).toEqual([
      '2026-04-06',
      '2026-04-13',
      '2026-04-20',
      '2026-04-27',
    ])
  })
})
