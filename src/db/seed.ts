import { db } from './schema'
import { generateId } from '../utils/id'
import type { ChoreoLevel, TimeLessonLevel } from '../types'

const DEFAULT_CHOREO_LEVELS: Omit<ChoreoLevel, 'id'>[] = [
  { name: '초급', price: 300000, sortOrder: 1 },
  { name: '중급', price: 400000, sortOrder: 2 },
  { name: '상급', price: 500000, sortOrder: 3 },
]

const DEFAULT_TIME_LEVELS: Omit<TimeLessonLevel, 'id'>[] = [
  { name: '개인 레슨', pricePerHour: 50000, sortOrder: 1 },
  { name: '그룹 레슨', pricePerHour: 30000, sortOrder: 2 },
]

export async function seedDefaultLevels(): Promise<void> {
  const choreoCount = await db.choreoLevels.count()
  if (choreoCount === 0) {
    const levels = DEFAULT_CHOREO_LEVELS.map((level) => ({
      ...level,
      id: generateId(),
    }))
    await db.choreoLevels.bulkAdd(levels)
  }

  const timeCount = await db.timeLessonLevels.count()
  if (timeCount === 0) {
    const levels = DEFAULT_TIME_LEVELS.map((level) => ({
      ...level,
      id: generateId(),
    }))
    await db.timeLessonLevels.bulkAdd(levels)
  }
}
