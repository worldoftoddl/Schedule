import { db } from '../db/schema'
import { generateId } from '../utils/id'
import { splitPrice } from '../utils/format'
import { expandWeeklyRecurring } from '../utils/recurring'
import { useCalendarStore } from '../stores/useCalendarStore'
import type { TimeLesson, ChoreoLesson, Choreography } from '../types'

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
    newChoreo?: { title: string; totalHours: number }
  }) => {
    const now = new Date()

    let choreoId = data.choreoId
    if (data.newChoreo) {
      const choreo: Choreography = {
        id: generateId(),
        studentId: data.studentId,
        levelId: data.levelId,
        title: data.newChoreo.title,
        totalHours: data.newChoreo.totalHours,
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      }
      await db.choreographies.add(choreo)
      choreoId = choreo.id
    }

    const base: Omit<ChoreoLesson, 'id' | 'date' | 'recurringGroupId'> = {
      type: 'choreo',
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      studentId: data.studentId,
      choreoId,
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
        const lessons = await db.timeLessons.where('recurringGroupId').equals(lesson.recurringGroupId).toArray()
        const ids = lessons.map((l) => l.id)
        await db.timeLessons.where('recurringGroupId').equals(lesson.recurringGroupId).delete()
        for (const lid of ids) {
          await db.payments.where('lessonId').equals(lid).delete()
        }
        return
      }
    }
    await db.timeLessons.delete(id)
    await db.payments.where('lessonId').equals(id).delete()
  }

  const deleteChoreoLesson = async (id: string, deleteAll = false) => {
    if (deleteAll) {
      const lesson = await db.choreoLessons.get(id)
      if (lesson?.recurringGroupId) {
        const lessons = await db.choreoLessons.where('recurringGroupId').equals(lesson.recurringGroupId).toArray()
        const ids = lessons.map((l) => l.id)
        await db.choreoLessons.where('recurringGroupId').equals(lesson.recurringGroupId).delete()
        for (const lid of ids) {
          await db.payments.where('lessonId').equals(lid).delete()
        }
        return
      }
    }
    await db.choreoLessons.delete(id)
    await db.payments.where('lessonId').equals(id).delete()
  }

  const updateTimeLesson = async (id: string, data: {
    startTime: string
    endTime: string
    durationHours: number
    totalPrice: number
    studentIds: string[]
    memo?: string
  }, updateAll = false) => {
    const updates = {
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      totalPrice: data.totalPrice,
      studentIds: data.studentIds,
      pricePerStudent: splitPrice(data.totalPrice, data.studentIds.length),
      memo: data.memo,
      updatedAt: new Date(),
    }
    if (updateAll) {
      const lesson = await db.timeLessons.get(id)
      if (lesson?.recurringGroupId) {
        // 기존 반복 그룹 일괄 수정
        const siblings = await db.timeLessons.where('recurringGroupId').equals(lesson.recurringGroupId).toArray()
        for (const s of siblings) {
          await db.timeLessons.update(s.id, updates)
        }
        return
      }
      if (lesson) {
        // 단일 레슨 → 반복으로 확장
        const { dates, recurringGroupId } = expandWeeklyRecurring(lesson.date, year, month)
        await db.timeLessons.update(id, { ...updates, recurringGroupId })
        const newDates = dates.filter((d) => d !== lesson.date)
        if (newDates.length > 0) {
          const newLessons: TimeLesson[] = newDates.map((date) => ({
            ...lesson,
            ...updates,
            id: generateId(),
            date,
            recurringGroupId,
          }))
          await db.timeLessons.bulkAdd(newLessons)
        }
        return
      }
    }
    await db.timeLessons.update(id, updates)
  }

  const updateChoreoLesson = async (id: string, data: {
    startTime: string
    endTime: string
    durationHours: number
    studentId: string
    choreoId: string
    levelId: string
    price: number
    memo?: string
  }, updateAll = false) => {
    const updates = {
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      studentId: data.studentId,
      choreoId: data.choreoId,
      levelId: data.levelId,
      price: data.price,
      memo: data.memo,
      updatedAt: new Date(),
    }
    if (updateAll) {
      const lesson = await db.choreoLessons.get(id)
      if (lesson?.recurringGroupId) {
        // 기존 반복 그룹 일괄 수정
        const siblings = await db.choreoLessons.where('recurringGroupId').equals(lesson.recurringGroupId).toArray()
        for (const s of siblings) {
          await db.choreoLessons.update(s.id, updates)
        }
        return
      }
      if (lesson) {
        // 단일 레슨 → 반복으로 확장
        const { dates, recurringGroupId } = expandWeeklyRecurring(lesson.date, year, month)
        await db.choreoLessons.update(id, { ...updates, recurringGroupId })
        const newDates = dates.filter((d) => d !== lesson.date)
        if (newDates.length > 0) {
          const newLessons: ChoreoLesson[] = newDates.map((date) => ({
            ...lesson,
            ...updates,
            id: generateId(),
            date,
            recurringGroupId,
          }))
          await db.choreoLessons.bulkAdd(newLessons)
        }
        return
      }
    }
    await db.choreoLessons.update(id, updates)
  }

  return { addTimeLesson, addChoreoLesson, updateTimeLesson, updateChoreoLesson, deleteTimeLesson, deleteChoreoLesson }
}
