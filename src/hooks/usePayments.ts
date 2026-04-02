import { db } from '../db/schema'
import { generateId } from '../utils/id'
import type { Payment } from '../types'

export function usePayments() {
  const addPayment = async (data: {
    studentId: string
    month: string
    amount: number
    date: string
    memo?: string
  }) => {
    const payment: Payment = {
      id: generateId(),
      studentId: data.studentId,
      month: data.month,
      amount: data.amount,
      date: data.date,
      memo: data.memo,
      createdAt: new Date(),
    }
    await db.payments.add(payment)
  }

  const deletePayment = async (id: string) => {
    await db.payments.delete(id)
  }

  return { addPayment, deletePayment }
}
