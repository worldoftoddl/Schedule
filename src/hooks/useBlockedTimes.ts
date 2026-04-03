import { db } from '../db/schema'
import { generateId } from '../utils/id'
import { expandWeeklyRecurring } from '../utils/recurring'
import { useCalendarStore } from '../stores/useCalendarStore'
import type { BlockedTime } from '../types'

export function useBlockedTimes() {
  const { year, month } = useCalendarStore()

  const addBlockedTime = async (data: {
    date: string
    startTime: string
    endTime: string
    label: string
    recurring: boolean
    recurringUntil?: string
  }) => {
    const now = new Date()
    const base: Omit<BlockedTime, 'id' | 'date' | 'recurringGroupId'> = {
      startTime: data.startTime,
      endTime: data.endTime,
      label: data.label,
      createdAt: now,
      updatedAt: now,
    }

    if (data.recurring) {
      const { dates, recurringGroupId } = expandWeeklyRecurring(data.date, year, month, data.recurringUntil)
      const blocks: BlockedTime[] = dates.map((date) => ({
        ...base,
        id: generateId(),
        date,
        recurringGroupId,
      }))
      await db.blockedTimes.bulkAdd(blocks)
    } else {
      await db.blockedTimes.add({ ...base, id: generateId(), date: data.date })
    }
  }

  const deleteBlockedTime = async (id: string, deleteAll = false) => {
    if (deleteAll) {
      const block = await db.blockedTimes.get(id)
      if (block?.recurringGroupId) {
        await db.blockedTimes.where('recurringGroupId').equals(block.recurringGroupId).delete()
        return
      }
    }
    await db.blockedTimes.delete(id)
  }

  return { addBlockedTime, deleteBlockedTime }
}
