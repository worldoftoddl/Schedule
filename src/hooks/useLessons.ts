import { db } from '../db/schema'
import { generateId } from '../utils/id'
import { splitPrice } from '../utils/format'
import { expandWeeklyRecurring } from '../utils/recurring'
import { useCalendarStore } from '../stores/useCalendarStore'
import type { TimeLesson, ChoreoLesson } from '../types'

export function useLessons() {
  const { year, month } = useCalendarStore()

  const addTimeLesson = async (data: {
    date: string
    startTime: string
    endTime: string
    durationHours: number
    totalPrice: number
    studentIds: string[]
    memo?: string
    recurring: boolean
  }) => {
    const now = new Date()
    const base: Omit<TimeLesson, 'id' | 'date' | 'recurringGroupId'> = {
      type: 'time',
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      totalPrice: data.totalPrice,
      studentIds: data.studentIds,
      pricePerStudent: splitPrice(data.totalPrice, data.studentIds.length),
      memo: data.memo,
      createdAt: now,
      updatedAt: now,
    }

    if (data.recurring) {
      const { dates, recurringGroupId } = expandWeeklyRecurring(data.date, year, month)
      const lessons: TimeLesson[] = dates.map((date) => ({
        ...base,
        id: generateId(),
        date,
        recurringGroupId,
      }))
      await db.timeLessons.bulkAdd(lessons)
    } else {
      const lesson: TimeLesson = { ...base, id: generateId(), date: data.date }
      await db.timeLessons.add(lesson)
    }
  }

  const addChoreoLesson = async (data: {
    date: string
    startTime: string
    endTime: string
    durationHours: number
    studentId: string
    choreoId: string
    levelId: string
    price: number
    memo?: string
    recurring: boolean
  }) => {
    const now = new Date()
    const base: Omit<ChoreoLesson, 'id' | 'date' | 'recurringGroupId'> = {
      type: 'choreo',
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      studentId: data.studentId,
      choreoId: data.choreoId,
      levelId: data.levelId,
      price: data.price,
      memo: data.memo,
      createdAt: now,
      updatedAt: now,
    }

    if (data.recurring) {
      const { dates, recurringGroupId } = expandWeeklyRecurring(data.date, year, month)
      const lessons: ChoreoLesson[] = dates.map((date) => ({
        ...base,
        id: generateId(),
        date,
        recurringGroupId,
      }))
      await db.choreoLessons.bulkAdd(lessons)
    } else {
      const lesson: ChoreoLesson = { ...base, id: generateId(), date: data.date }
      await db.choreoLessons.add(lesson)
    }
  }

  const deleteTimeLesson = async (id: string, deleteAll = false) => {
    if (deleteAll) {
      const lesson = await db.timeLessons.get(id)
      if (lesson?.recurringGroupId) {
        await db.timeLessons.where('recurringGroupId').equals(lesson.recurringGroupId).delete()
        return
      }
    }
    await db.timeLessons.delete(id)
  }

  const deleteChoreoLesson = async (id: string, deleteAll = false) => {
    if (deleteAll) {
      const lesson = await db.choreoLessons.get(id)
      if (lesson?.recurringGroupId) {
        await db.choreoLessons.where('recurringGroupId').equals(lesson.recurringGroupId).delete()
        return
      }
    }
    await db.choreoLessons.delete(id)
  }

  return { addTimeLesson, addChoreoLesson, deleteTimeLesson, deleteChoreoLesson }
}
