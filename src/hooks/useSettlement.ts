import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { TimeLesson, ChoreoLesson, Payment, MonthlySettlement, StudentSettlement } from '../types'

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
  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray(), [])

  const payments = useLiveQuery(
    () => db.payments.where('month').equals(month).toArray(),
    [month]
  )

  const settlement: MonthlySettlement | null =
    timeLessons && choreoLessons && students && payments
      ? computeSettlement(month, timeLessons, choreoLessons, students, payments)
      : null

  return { settlement, teams: teams ?? [], students: students ?? [] }
}

function computeSettlement(
  month: string,
  timeLessons: TimeLesson[],
  choreoLessons: ChoreoLesson[],
  students: { id: string; name: string }[],
  payments: Payment[]
): MonthlySettlement {
  const paidKeys = new Set(payments.map((p) => `${p.lessonId}:${p.studentId}`))
  const map = new Map<string, StudentSettlement>()

  for (const s of students) {
    map.set(s.id, {
      studentId: s.id,
      studentName: s.name,
      lessons: [],
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
        const paid = paidKeys.has(`${lesson.id}:${sid}`)
        entry.lessons.push({
          lessonId: lesson.id,
          lessonType: 'time',
          date: lesson.date,
          description: `타임 ${lesson.startTime}~${lesson.endTime}`,
          amount: lesson.pricePerStudent,
          paid,
        })
        if (paid) {
          entry.paidAmount += lesson.pricePerStudent
        }
      }
    }
  }

  for (const lesson of choreoLessons) {
    const entry = map.get(lesson.studentId)
    if (entry) {
      entry.choreoLessonCount++
      entry.choreoLessonTotal += lesson.price
      const paid = paidKeys.has(`${lesson.id}:${lesson.studentId}`)
      entry.lessons.push({
        lessonId: lesson.id,
        lessonType: 'choreo',
        date: lesson.date,
        description: `안무 ${lesson.startTime}~${lesson.endTime}`,
        amount: lesson.price,
        paid,
      })
      if (paid) {
        entry.paidAmount += lesson.price
      }
    }
  }

  let totalIncome = 0
  let totalOutstanding = 0

  for (const entry of map.values()) {
    entry.totalAmount = entry.timeLessonTotal + entry.choreoLessonTotal
    entry.outstandingAmount = entry.totalAmount - entry.paidAmount
    entry.lessons.sort((a, b) => a.date.localeCompare(b.date))
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
