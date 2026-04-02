import { describe, it, expect } from 'vitest'
import { computeSettlement } from '../useSettlement'
import type { TimeLesson, ChoreoLesson, Payment } from '../../types'

const makeTimeLesson = (overrides: Partial<TimeLesson> & Pick<TimeLesson, 'id' | 'studentIds' | 'pricePerStudent'>): TimeLesson => ({
  type: 'time',
  date: '2026-04-01',
  startTime: '10:00',
  endTime: '11:00',
  durationHours: 1,
  totalPrice: overrides.pricePerStudent * overrides.studentIds.length,
  memo: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeChoreoLesson = (overrides: Partial<ChoreoLesson> & Pick<ChoreoLesson, 'id' | 'studentId' | 'price'>): ChoreoLesson => ({
  type: 'choreo',
  date: '2026-04-01',
  startTime: '10:00',
  endTime: '11:00',
  durationHours: 1,
  choreoId: 'ch1',
  levelId: 'lv1',
  memo: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makePayment = (overrides: Partial<Payment> & Pick<Payment, 'studentId' | 'amount' | 'lessonId' | 'lessonType'>): Payment => ({
  id: 'pay-' + overrides.lessonId,
  month: '2026-04',
  date: '2026-04-01',
  createdAt: new Date(),
  ...overrides,
})

describe('computeSettlement', () => {
  const students = [
    { id: 's1', name: '선수A' },
    { id: 's2', name: '선수B' },
  ]

  it('computes time lesson totals per student', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1', 's2'], pricePerStudent: 50000 }),
      makeTimeLesson({ id: 't2', studentIds: ['s1'], pricePerStudent: 80000 }),
    ]

    const result = computeSettlement('2026-04', timeLessons, [], students, [])

    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.timeLessonCount).toBe(2)
    expect(s1.timeLessonTotal).toBe(130000)

    const s2 = result.studentSummaries.find((s) => s.studentId === 's2')!
    expect(s2.timeLessonCount).toBe(1)
    expect(s2.timeLessonTotal).toBe(50000)
  })

  it('computes choreo lesson totals', () => {
    const choreoLessons = [
      makeChoreoLesson({ id: 'c1', studentId: 's1', price: 300000 }),
    ]

    const result = computeSettlement('2026-04', [], choreoLessons, students, [])
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.choreoLessonCount).toBe(1)
    expect(s1.choreoLessonTotal).toBe(300000)
  })

  it('computes outstanding amount with payments', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1'], pricePerStudent: 100000 }),
    ]
    const payments = [
      makePayment({ studentId: 's1', amount: 100000, lessonId: 't1', lessonType: 'time' }),
    ]

    const result = computeSettlement('2026-04', timeLessons, [], students, payments)
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.totalAmount).toBe(100000)
    expect(s1.paidAmount).toBe(100000)
    expect(s1.outstandingAmount).toBe(0)
  })

  it('computes totals correctly', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1', 's2'], pricePerStudent: 50000 }),
    ]
    const choreoLessons = [
      makeChoreoLesson({ id: 'c1', studentId: 's1', price: 200000 }),
    ]
    const payments = [
      makePayment({ studentId: 's1', amount: 50000, lessonId: 't1', lessonType: 'time' }),
    ]

    const result = computeSettlement('2026-04', timeLessons, choreoLessons, students, payments)
    // s1: time 50000 (paid) + choreo 200000 (unpaid) = 250000, paid 50000
    // s2: time 50000 (unpaid) = 50000, paid 0
    expect(result.totalIncome).toBe(300000)
    expect(result.totalOutstanding).toBe(250000) // s1: 200000, s2: 50000
  })

  it('excludes students with no lessons or payments', () => {
    const result = computeSettlement('2026-04', [], [], students, [])
    expect(result.studentSummaries).toHaveLength(0)
  })

  it('marks lessons as paid/unpaid correctly', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1'], pricePerStudent: 50000 }),
      makeTimeLesson({ id: 't2', studentIds: ['s1'], pricePerStudent: 50000 }),
    ]
    const payments = [
      makePayment({ studentId: 's1', amount: 50000, lessonId: 't1', lessonType: 'time' }),
    ]

    const result = computeSettlement('2026-04', timeLessons, [], students, payments)
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.lessons).toHaveLength(2)
    const paidLesson = s1.lessons.find((l) => l.lessonId === 't1')!
    const unpaidLesson = s1.lessons.find((l) => l.lessonId === 't2')!
    expect(paidLesson.paid).toBe(true)
    expect(unpaidLesson.paid).toBe(false)
  })
})
