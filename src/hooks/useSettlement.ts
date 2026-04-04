import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { calcStudentPrice } from '../utils/format'
import type { TimeLesson, ChoreoLesson, Choreography, Payment, MonthlySettlement, StudentSettlement } from '../types'

export function useSettlement(month: string) {
  const timeLessons = useLiveQuery(
    () => db.timeLessons.where('date').startsWith(month).toArray(),
    [month]
  )

  // 안무는 월을 걸칠 수 있으므로 전체를 가져옴
  const allChoreoLessons = useLiveQuery(
    () => db.choreoLessons.toArray(),
    []
  )

  const choreographies = useLiveQuery(
    () => db.choreographies.toArray(),
    []
  )

  const students = useLiveQuery(() => db.students.orderBy('name').toArray(), [])
  const teams = useLiveQuery(() => db.teams.orderBy('sortOrder').toArray(), [])

  const payments = useLiveQuery(
    () => db.payments.where('month').equals(month).toArray(),
    [month]
  )

  const settlement: MonthlySettlement | null =
    timeLessons && allChoreoLessons && choreographies && students && payments
      ? computeSettlement(month, timeLessons, allChoreoLessons, choreographies, students, payments)
      : null

  return { settlement, teams: teams ?? [], students: students ?? [] }
}

function computeSettlement(
  month: string,
  timeLessons: TimeLesson[],
  allChoreoLessons: ChoreoLesson[],
  choreographies: Choreography[],
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

  // 선수 미배정 레슨용 가상 엔트리
  const UNASSIGNED_ID = '__unassigned__'

  // 타임 레슨
  for (const lesson of timeLessons) {
    if (lesson.studentIds.length === 0) {
      // 선수 미배정 레슨
      if (!map.has(UNASSIGNED_ID)) {
        map.set(UNASSIGNED_ID, {
          studentId: UNASSIGNED_ID,
          studentName: '선수 미배정',
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
      const entry = map.get(UNASSIGNED_ID)!
      entry.timeLessonCount++
      entry.timeLessonTotal += lesson.totalPrice
      const paid = paidKeys.has(`${lesson.id}:${UNASSIGNED_ID}`)
      entry.lessons.push({
        lessonId: lesson.id,
        lessonType: 'time',
        date: lesson.date,
        description: `타임 ${lesson.startTime}~${lesson.endTime} (${lesson.baseDuration ?? 60}분)`,
        amount: lesson.totalPrice,
        paid,
      })
      if (paid) {
        entry.paidAmount += lesson.totalPrice
      }
    } else {
      for (const sid of lesson.studentIds) {
        const entry = map.get(sid)
        if (entry) {
          entry.timeLessonCount++
          const allocation = lesson.studentAllocations?.[sid]
          const amount = allocation != null
            ? calcStudentPrice(allocation, lesson.baseDuration ?? 60, lesson.totalPrice)
            : lesson.pricePerStudent
          const desc = allocation != null
            ? `타임 ${lesson.startTime}~${lesson.endTime} (${allocation}/${lesson.baseDuration ?? 60}분)`
            : `타임 ${lesson.startTime}~${lesson.endTime} (${lesson.baseDuration ?? 60}분)`
          entry.timeLessonTotal += amount
          const paid = paidKeys.has(`${lesson.id}:${sid}`)
          entry.lessons.push({
            lessonId: lesson.id,
            lessonType: 'time',
            date: lesson.date,
            description: desc,
            amount,
            paid,
          })
          if (paid) {
            entry.paidAmount += amount
          }
        }
      }
    }
  }

  // 안무: choreography 단위로 정산 — 시간이 채워지는 달에 한 번만
  for (const choreo of choreographies) {
    const lessons = allChoreoLessons
      .filter((l) => l.choreoId === choreo.id)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

    if (lessons.length === 0) continue

    // 누적 시간 계산 → 완료 시점 찾기
    let accumulated = 0
    let completionDate: string | null = null
    for (const l of lessons) {
      accumulated += l.durationHours
      if (accumulated >= choreo.totalHours) {
        completionDate = l.date
        break
      }
    }

    // 정산 대상 달 결정: 완료되었으면 완료된 달, 미완료면 아직 정산 안 함
    const settlementMonth = completionDate ? completionDate.slice(0, 7) : null
    if (settlementMonth !== month) continue

    const entry = map.get(choreo.studentId)
    if (entry) {
      entry.choreoLessonCount++
      entry.choreoLessonTotal += choreo.totalHours > 0 ? lessons[0].price : 0
      // 안무 가격 = 최초 레슨 생성 시 복사된 레벨 가격 (전체 안무 가격)
      const choreoPrice = lessons[0].price
      const paid = paidKeys.has(`${choreo.id}:${choreo.studentId}`)
      entry.lessons.push({
        lessonId: choreo.id,
        lessonType: 'choreo',
        date: completionDate!,
        description: `안무 "${choreo.title}" (${accumulated}/${choreo.totalHours}타임)`,
        amount: choreoPrice,
        paid,
      })
      if (paid) {
        entry.paidAmount += choreoPrice
      }
    }
  }

  let totalIncome = 0
  let totalOutstanding = 0

  for (const entry of map.values()) {
    entry.totalAmount = entry.timeLessonTotal + entry.choreoLessonTotal
    entry.outstandingAmount = entry.totalAmount - entry.paidAmount
    entry.lessons.sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description))
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
