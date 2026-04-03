import { describe, it, expect } from 'vitest'
import { computeSettlement } from '../useSettlement'
import type { TimeLesson, ChoreoLesson, Choreography, Payment } from '../../types'

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

const makeChoreo = (overrides: Partial<Choreography> & Pick<Choreography, 'id' | 'studentId' | 'totalHours'>): Choreography => ({
  levelId: 'lv1',
  title: '테스트 안무',
  status: 'in_progress',
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
    { id: 's2', name: '��수B' },
  ]

  it('computes time lesson totals per student', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1', 's2'], pricePerStudent: 50000 }),
      makeTimeLesson({ id: 't2', studentIds: ['s1'], pricePerStudent: 80000 }),
    ]

    const result = computeSettlement('2026-04', timeLessons, [], [], students, [])

    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.timeLessonCount).toBe(2)
    expect(s1.timeLessonTotal).toBe(130000)

    const s2 = result.studentSummaries.find((s) => s.studentId === 's2')!
    expect(s2.timeLessonCount).toBe(1)
    expect(s2.timeLessonTotal).toBe(50000)
  })

  it('settles choreo when hours are completed in this month', () => {
    const choreo = makeChoreo({ id: 'ch1', studentId: 's1', totalHours: 3 })
    const choreoLessons = [
      makeChoreoLesson({ id: 'cl1', studentId: 's1', price: 300000, date: '2026-03-15', durationHours: 1, choreoId: 'ch1' }),
      makeChoreoLesson({ id: 'cl2', studentId: 's1', price: 300000, date: '2026-04-01', durationHours: 1, choreoId: 'ch1' }),
      makeChoreoLesson({ id: 'cl3', studentId: 's1', price: 300000, date: '2026-04-08', durationHours: 1, choreoId: 'ch1' }),
    ]

    // 3시간 완료 시점 = 2026-04-08 → 4월에 정산
    const result = computeSettlement('2026-04', [], choreoLessons, [choreo], students, [])
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.choreoLessonCount).toBe(1)
    expect(s1.choreoLessonTotal).toBe(300000)
    expect(s1.totalAmount).toBe(300000)
  })

  it('does not settle incomplete choreo', () => {
    const choreo = makeChoreo({ id: 'ch1', studentId: 's1', totalHours: 5 })
    const choreoLessons = [
      makeChoreoLesson({ id: 'cl1', studentId: 's1', price: 300000, date: '2026-04-01', durationHours: 1, choreoId: 'ch1' }),
      makeChoreoLesson({ id: 'cl2', studentId: 's1', price: 300000, date: '2026-04-08', durationHours: 1, choreoId: 'ch1' }),
    ]

    // 2/5시간만 완료 → 정산 안 됨
    const result = computeSettlement('2026-04', [], choreoLessons, [choreo], students, [])
    expect(result.studentSummaries).toHaveLength(0)
  })

  it('does not settle choreo in wrong month', () => {
    const choreo = makeChoreo({ id: 'ch1', studentId: 's1', totalHours: 2 })
    const choreoLessons = [
      makeChoreoLesson({ id: 'cl1', studentId: 's1', price: 300000, date: '2026-03-15', durationHours: 1, choreoId: 'ch1' }),
      makeChoreoLesson({ id: 'cl2', studentId: 's1', price: 300000, date: '2026-03-22', durationHours: 1, choreoId: 'ch1' }),
    ]

    // 완료 시점 = 3월 → 4월 정산에는 안 잡힘
    const result = computeSettlement('2026-04', [], choreoLessons, [choreo], students, [])
    expect(result.studentSummaries).toHaveLength(0)
  })

  it('computes outstanding amount with payments', () => {
    const timeLessons = [
      makeTimeLesson({ id: 't1', studentIds: ['s1'], pricePerStudent: 100000 }),
    ]
    const payments = [
      makePayment({ studentId: 's1', amount: 100000, lessonId: 't1', lessonType: 'time' }),
    ]

    const result = computeSettlement('2026-04', timeLessons, [], [], students, payments)
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.totalAmount).toBe(100000)
    expect(s1.paidAmount).toBe(100000)
    expect(s1.outstandingAmount).toBe(0)
  })

  it('excludes students with no lessons or payments', () => {
    const result = computeSettlement('2026-04', [], [], [], students, [])
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

    const result = computeSettlement('2026-04', timeLessons, [], [], students, payments)
    const s1 = result.studentSummaries.find((s) => s.studentId === 's1')!
    expect(s1.lessons).toHaveLength(2)
    const paidLesson = s1.lessons.find((l) => l.lessonId === 't1')!
    const unpaidLesson = s1.lessons.find((l) => l.lessonId === 't2')!
    expect(paidLesson.paid).toBe(true)
    expect(unpaidLesson.paid).toBe(false)
  })
})
