import { db } from './schema'
import { generateId } from '../utils/id'
import type { ChoreoLevel } from '../types'

const DEFAULT_LEVELS: Omit<ChoreoLevel, 'id'>[] = [
  { name: '초급', price: 300000, sortOrder: 1 },
  { name: '중급', price: 400000, sortOrder: 2 },
  { name: '상급', price: 500000, sortOrder: 3 },
]

export async function seedDefaultLevels(): Promise<void> {
  const count = await db.choreoLevels.count()
  if (count > 0) return

  const levels = DEFAULT_LEVELS.map((level) => ({
    ...level,
    id: generateId(),
  }))

  await db.choreoLevels.bulkAdd(levels)
}
