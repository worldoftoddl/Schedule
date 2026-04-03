import type { SlotStatus } from '../../types'

interface TimeSlotProps {
  status: SlotStatus
  label?: string
}

const STATUS_STYLES: Record<SlotStatus, string> = {
  free: 'bg-gray-50',
  time: 'bg-indigo-400',
  choreo: 'bg-pink-400',
  blocked: 'bg-gray-300',
  overlap: 'bg-purple-400',
}

export function TimeSlot({ status, label }: TimeSlotProps) {
  return (
    <div
      className={`h-6 w-full border-b border-gray-100 ${STATUS_STYLES[status]}`}
      title={label ?? status}
    />
  )
}
