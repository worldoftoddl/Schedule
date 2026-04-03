import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { generateId } from '../utils/id'
import type { Choreography } from '../types'

export function useChoreographies() {
  const choreographies = useLiveQuery(() => db.choreographies.toArray())

  const addChoreography = async (data: {
    studentId: string
    levelId: string
    title: string
    totalHours: number
  }): Promise<string> => {
    const now = new Date()
    const choreo: Choreography = {
      id: generateId(),
      studentId: data.studentId,
      levelId: data.levelId,
      title: data.title,
      totalHours: data.totalHours,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    }
    await db.choreographies.add(choreo)
    return choreo.id
  }

  const getCompletedHours = async (choreoId: string): Promise<number> => {
    const lessons = await db.choreoLessons.where('choreoId').equals(choreoId).toArray()
    return lessons.reduce((sum, l) => sum + l.durationHours, 0)
  }

  const updateStatus = async (choreoId: string) => {
    const choreo = await db.choreographies.get(choreoId)
    if (!choreo) return
    const completed = await getCompletedHours(choreoId)
    const newStatus = completed >= choreo.totalHours ? 'completed' : 'in_progress'
    if (choreo.status !== newStatus) {
      await db.choreographies.update(choreoId, { status: newStatus, updatedAt: new Date() })
    }
  }

  const deleteChoreography = async (id: string) => {
    await db.choreographies.delete(id)
    // 연결된 안무 레슨도 삭제
    const lessons = await db.choreoLessons.where('choreoId').equals(id).toArray()
    for (const lesson of lessons) {
      await db.choreoLessons.delete(lesson.id)
      await db.payments.where('lessonId').equals(lesson.id).delete()
    }
  }

  return {
    choreographies: choreographies ?? [],
    addChoreography,
    deleteChoreography,
    getCompletedHours,
    updateStatus,
  }
}
