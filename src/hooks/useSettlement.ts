import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { MonthlySettlement, StudentSettlement } from '../types'

export function useSettlement(month: string) {
  const timeLessons = useLiveQuery(
    () => db.timeLessons.where('date').startsWith(month).toArray(),
    [month]
  )

  const choreoLessons = useLiveQuery(
    () => db.choreoLessons.where('date').startsWith(month).toArray(),
    [month]
  )

  const students = useLiveQuery(() => db.students.toArray(), [])

  const payments = useLiveQuery(
    () => db.payments.where('month').equals(month).toArray(),
    [month]
  )

  const settlement: MonthlySettlement | null =
    timeLessons && choreoLessons && students && payments
      ? computeSettlement(month, timeLessons, choreoLessons, students, payments)
      : null

  return settlement
}

function computeSettlement(
  month: string,
  timeLessons: { studentIds: string[]; pricePerStudent: number }[],
  choreoLessons: { studentId: string; price: number }[],
  students: { id: string; name: string }[],
  payments: { studentId: string; amount: number }[]
): MonthlySettlement {
  const map = new Map<string, StudentSettlement>()

  for (const s of students) {
    map.set(s.id, {
      studentId: s.id,
      studentName: s.name,
      timeLessonCount: 0,
      timeLessonTotal: 0,
      choreoLessonCount: 0,
      choreoLessonTotal: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    })
  }

  for (const lesson of timeLessons) {
    for (const sid of lesson.studentIds) {
      const entry = map.get(sid)
      if (entry) {
        entry.timeLessonCount++
        entry.timeLessonTotal += lesson.pricePerStudent
      }
    }
  }

  for (const lesson of choreoLessons) {
    const entry = map.get(lesson.studentId)
    if (entry) {
      entry.choreoLessonCount++
      entry.choreoLessonTotal += lesson.price
    }
  }

  for (const payment of payments) {
    const entry = map.get(payment.studentId)
    if (entry) {
      entry.paidAmount += payment.amount
    }
  }

  let totalIncome = 0
  let totalOutstanding = 0

  for (const entry of map.values()) {
    entry.totalAmount = entry.timeLessonTotal + entry.choreoLessonTotal
    entry.outstandingAmount = entry.totalAmount - entry.paidAmount
    totalIncome += entry.totalAmount
    totalOutstanding += entry.outstandingAmount
  }

  const summaries = Array.from(map.values()).filter(
    (s) => s.totalAmount > 0 || s.paidAmount > 0
  )

  return {
    month,
    studentSummaries: summaries,
    totalIncome,
    totalOutstanding,
  }
}

export { computeSettlement }
