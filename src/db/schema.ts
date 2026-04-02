import Dexie, { type EntityTable } from 'dexie'
import type { Student, TimeLesson, ChoreoLesson, Choreography, ChoreoLevel, Payment } from '../types'

class LessonScheduleDB extends Dexie {
  students!: EntityTable<Student, 'id'>
  timeLessons!: EntityTable<TimeLesson, 'id'>
  choreoLessons!: EntityTable<ChoreoLesson, 'id'>
  choreographies!: EntityTable<Choreography, 'id'>
  choreoLevels!: EntityTable<ChoreoLevel, 'id'>
  payments!: EntityTable<Payment, 'id'>

  constructor() {
    super('LessonScheduleDB')

    this.version(1).stores({
      students: 'id, name',
      timeLessons: 'id, date, recurringGroupId, *studentIds',
      choreoLessons: 'id, date, studentId, choreoId, levelId, recurringGroupId',
      choreographies: 'id, studentId, levelId, status',
      choreoLevels: 'id, sortOrder',
      payments: 'id, studentId, month, date',
    })
  }
}

export const db = new LessonScheduleDB()
