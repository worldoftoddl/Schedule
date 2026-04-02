import { describe, it, expect } from 'vitest'
import { computeSettlement } from '../useSettlement'

describe('computeSettlement', () => {
  const students = [
    { id: 's1', name: '학생A' },
    { id: 's2', name: '학생B' },
  ]

  it('computes time lesson totals per student', () => {
    const timeLessons = [
      { studentIds: ['s1', 's2'], pricePerStudent: 50000 },
      { studentIds: ['s1'], pricePerStudent: 80000 },
    ]

    const result = computeSettlement('2026-04', timeLessons, [], students, [])

    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.timeLessonCount).toBe(2)
    expect(s1.timeLessonTotal).toBe(130000) // 50000 + 80000

    const s2 = result.studentSummaries.find((s) => s.studentId === 's2')!
    expect(s2.timeLessonCount).toBe(1)
    expect(s2.timeLessonTotal).toBe(50000)
  })

  it('computes choreo lesson totals', () => {
    const choreoLessons = [
      { studentId: 's1', price: 300000 },
    ]

    const result = computeSettlement('2026-04', [], choreoLessons, students, [])
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.choreoLessonCount).toBe(1)
    expect(s1.choreoLessonTotal).toBe(300000)
  })

  it('computes outstanding amount with payments', () => {
    const timeLessons = [
      { studentIds: ['s1'], pricePerStudent: 100000 },
    ]
    const payments = [
      { studentId: 's1', amount: 60000 },
    ]

    const result = computeSettlement('2026-04', timeLessons, [], students, payments)
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.totalAmount).toBe(100000)
    expect(s1.paidAmount).toBe(60000)
    expect(s1.outstandingAmount).toBe(40000)
  })

  it('computes totals correctly', () => {
    const timeLessons = [
      { studentIds: ['s1', 's2'], pricePerStudent: 50000 },
    ]
    const choreoLessons = [
      { studentId: 's1', price: 200000 },
    ]
    const payments = [
      { studentId: 's1', amount: 100000 },
    ]

    const result = computeSettlement('2026-04', timeLessons, choreoLessons, students, payments)
    expect(result.totalIncome).toBe(300000) // s1: 50000+200000, s2: 50000
    expect(result.totalOutstanding).toBe(200000) // s1: 250000-100000=150000, s2: 50000
  })

  it('excludes students with no lessons or payments', () => {
    const result = computeSettlement('2026-04', [], [], students, [])
    expect(result.studentSummaries).toHaveLength(0)
  })
})
