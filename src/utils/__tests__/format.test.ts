import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatMonth,
  getMonthKey,
  getDateKey,
  splitPrice,
  calcTimes,
} from '../format'

describe('formatCurrency', () => {
  it('formats positive amount with comma separator', () => {
    expect(formatCurrency(100000)).toBe('100,000원')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0원')
  })

  it('formats large amount', () => {
    expect(formatCurrency(1500000)).toBe('1,500,000원')
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD to M월 D일', () => {
    expect(formatDate('2026-04-02')).toBe('4월 2일')
  })

  it('removes leading zeros', () => {
    expect(formatDate('2026-01-05')).toBe('1월 5일')
  })
})

describe('formatMonth', () => {
  it('formats YYYY-MM to year/month string', () => {
    expect(formatMonth('2026-04')).toBe('2026년 4월')
  })
})

describe('getMonthKey', () => {
  it('returns YYYY-MM format', () => {
    expect(getMonthKey(new Date(2026, 3, 15))).toBe('2026-04')
  })

  it('pads single digit months', () => {
    expect(getMonthKey(new Date(2026, 0, 1))).toBe('2026-01')
  })
})

describe('getDateKey', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getDateKey(new Date(2026, 3, 2))).toBe('2026-04-02')
  })

  it('pads single digit days', () => {
    expect(getDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('splitPrice', () => {
  it('splits evenly', () => {
    expect(splitPrice(100000, 2)).toBe(50000)
  })

  it('floors when not evenly divisible', () => {
    expect(splitPrice(100000, 3)).toBe(33333)
  })

  it('returns 0 for zero count', () => {
    expect(splitPrice(100000, 0)).toBe(0)
  })

  it('returns full price for single student', () => {
    expect(splitPrice(80000, 1)).toBe(80000)
  })
})

describe('calcTimes', () => {
  it('50분 = 1타임', () => {
    expect(calcTimes('10:00', '10:50')).toBe(1)
  })

  it('60분 = 1타임', () => {
    expect(calcTimes('10:00', '11:00')).toBe(1)
  })

  it('80분 = 1.5타임', () => {
    expect(calcTimes('10:00', '11:20')).toBe(1.5)
  })

  it('90분 = 1.5타임', () => {
    expect(calcTimes('10:00', '11:30')).toBe(1.5)
  })

  it('110분 = 2타임', () => {
    expect(calcTimes('10:00', '11:50')).toBe(2)
  })

  it('120분 = 2타임', () => {
    expect(calcTimes('10:00', '12:00')).toBe(2)
  })

  it('23:00~23:50 = 1타임', () => {
    expect(calcTimes('23:00', '23:50')).toBe(1)
  })

  it('최소 0.5타임 보장', () => {
    expect(calcTimes('10:00', '10:10')).toBe(0.5)
  })
})
