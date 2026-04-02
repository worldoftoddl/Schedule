import { db } from '../db/schema'
import { generateId } from '../utils/id'
import type { LessonType, Payment } from '../types'

export function usePayments() {
  const addPayment = async (data: {
    studentId: string
    month: string
    amount: number
    date: string
    lessonId: string
    lessonType: LessonType
    memo?: string
  }) => {
    const payment: Payment = {
      id: generateId(),
      studentId: data.studentId,
      month: data.month,
      amount: data.amount,
      date: data.date,
      lessonId: data.lessonId,
      lessonType: data.lessonType,
      memo: data.memo,
      createdAt: new Date(),
    }
    await db.payments.add(payment)
  }

  const deletePayment = async (id: string) => {
    await db.payments.delete(id)
  }

  const deletePaymentsByLessonId = async (lessonId: string) => {
    await db.payments.where('lessonId').equals(lessonId).delete()
  }

  const toggleLessonPayment = async (data: {
    studentId: string
    month: string
    lessonId: string
    lessonType: LessonType
    amount: number
  }) => {
    const candidates = await db.payments.where('lessonId').equals(data.lessonId).toArray()
    const existing = candidates.find((p) => p.studentId === data.studentId)
    if (existing) {
      await db.payments.delete(existing.id)
    } else {
      await addPayment({
        studentId: data.studentId,
        month: data.month,
        amount: data.amount,
        date: new Date().toISOString().split('T')[0],
        lessonId: data.lessonId,
        lessonType: data.lessonType,
      })
    }
  }

  return { addPayment, deletePayment, deletePaymentsByLessonId, toggleLessonPayment }
}
