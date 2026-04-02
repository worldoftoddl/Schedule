import Dexie, { type EntityTable } from 'dexie'
import type { Team, Student, TimeLesson, ChoreoLesson, Choreography, ChoreoLevel, TimeLessonLevel, Payment } from '../types'

class LessonScheduleDB extends Dexie {
  teams!: EntityTable<Team, 'id'>
  students!: EntityTable<Student, 'id'>
  timeLessons!: EntityTable<TimeLesson, 'id'>
  choreoLessons!: EntityTable<ChoreoLesson, 'id'>
  choreographies!: EntityTable<Choreography, 'id'>
  choreoLevels!: EntityTable<ChoreoLevel, 'id'>
  timeLessonLevels!: EntityTable<TimeLessonLevel, 'id'>
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

    this.version(2).stores({
      students: 'id, name',
      timeLessons: 'id, date, recurringGroupId, *studentIds',
      choreoLessons: 'id, date, studentId, choreoId, levelId, recurringGroupId',
      choreographies: 'id, studentId, levelId, status',
      choreoLevels: 'id, sortOrder',
      timeLessonLevels: 'id, sortOrder',
      payments: 'id, studentId, month, date, lessonId, lessonType',
    })

    this.version(3).stores({
      teams: 'id, sortOrder',
      students: 'id, name, teamId',
      timeLessons: 'id, date, recurringGroupId, *studentIds',
      choreoLessons: 'id, date, studentId, choreoId, levelId, recurringGroupId',
      choreographies: 'id, studentId, levelId, status',
      choreoLevels: 'id, sortOrder',
      timeLessonLevels: 'id, sortOrder',
      payments: 'id, studentId, month, date, lessonId, lessonType',
    })
  }
}

export const db = new LessonScheduleDB()
