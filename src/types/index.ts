export interface Team {
  id: string
  name: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  name: string
  teamId: string
  phone?: string
  memo?: string
  createdAt: Date
  updatedAt: Date
}

export type LessonType = 'time' | 'choreo'

export interface TimeLesson {
  id: string
  type: 'time'
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationHours: number
  totalPrice: number
  studentIds: string[]
  pricePerStudent: number // computed: totalPrice / studentIds.length
  recurringGroupId?: string
  memo?: string
  createdAt: Date
  updatedAt: Date
}

export interface ChoreoLesson {
  id: string
  type: 'choreo'
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationHours: number
  studentId: string
  choreoId: string
  levelId: string
  price: number // copied from level at creation time
  recurringGroupId?: string
  memo?: string
  createdAt: Date
  updatedAt: Date
}

export type Lesson = TimeLesson | ChoreoLesson

export interface Choreography {
  id: string
  studentId: string
  levelId: string
  title: string
  totalHours: number
  status: 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface ChoreoLevel {
  id: string
  name: string
  price: number // total price for the choreography at this level
  sortOrder: number
}

export interface TimeLessonLevel {
  id: string
  name: string
  pricePerHour: number
  sortOrder: number
}

export interface Payment {
  id: string
  studentId: string
  month: string // YYYY-MM
  amount: number
  date: string // YYYY-MM-DD
  lessonId: string
  lessonType: LessonType
  memo?: string
  createdAt: Date
}

export interface LessonSettlement {
  lessonId: string // time lesson: lesson id, choreo: choreography id
  lessonType: LessonType
  date: string
  description: string
  amount: number
  paid: boolean
}

export interface StudentSettlement {
  studentId: string
  studentName: string
  lessons: LessonSettlement[]
  timeLessonCount: number
  timeLessonTotal: number
  choreoLessonCount: number
  choreoLessonTotal: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
}

export interface MonthlySettlement {
  month: string
  studentSummaries: StudentSettlement[]
  totalIncome: number
  totalOutstanding: number
}
