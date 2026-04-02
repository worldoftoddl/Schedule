import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { generateId } from '../utils/id'
import type { Student } from '../types'

export function useStudents() {
  const students = useLiveQuery(() =>
    db.students.orderBy('name').toArray()
  )

  const addStudent = async (name: string, phone?: string, memo?: string) => {
    const now = new Date()
    const student: Student = {
      id: generateId(),
      name,
      phone: phone || undefined,
      memo: memo || undefined,
      createdAt: now,
      updatedAt: now,
    }
    await db.students.add(student)
    return student.id
  }

  const updateStudent = async (
    id: string,
    data: Partial<Pick<Student, 'name' | 'phone' | 'memo'>>
  ) => {
    await db.students.update(id, { ...data, updatedAt: new Date() })
  }

  const deleteStudent = async (id: string) => {
    await db.transaction('rw', [db.students, db.timeLessons, db.choreoLessons, db.choreographies, db.payments], async () => {
      await db.students.delete(id)
      await db.choreoLessons.where('studentId').equals(id).delete()
      await db.choreographies.where('studentId').equals(id).delete()
      await db.payments.where('studentId').equals(id).delete()

      const timeLessons = await db.timeLessons.toArray()
      for (const lesson of timeLessons) {
        if (lesson.studentIds.includes(id)) {
          const newStudentIds = lesson.studentIds.filter((sid) => sid !== id)
          if (newStudentIds.length === 0) {
            await db.timeLessons.delete(lesson.id)
          } else {
            await db.timeLessons.update(lesson.id, {
              studentIds: newStudentIds,
              pricePerStudent: Math.floor(lesson.totalPrice / newStudentIds.length),
            })
          }
        }
      }
    })
  }

  return { students: students ?? [], addStudent, updateStudent, deleteStudent }
}
