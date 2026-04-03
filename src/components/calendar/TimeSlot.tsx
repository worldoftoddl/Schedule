import type { SlotStatus, LessonSlotMeta } from '../../types'

interface TimeSlotProps {
  status: SlotStatus
  label?: string
  lessonMeta?: LessonSlotMeta
}

const STATUS_STYLES: Record<SlotStatus, string> = {
  free: 'bg-gray-50',
  time: 'bg-indigo-400',
  choreo: 'bg-pink-400',
  blocked: 'bg-gray-300',
  overlap: 'bg-purple-400',
}

export function TimeSlot({ status, label, lessonMeta }: TimeSlotProps) {
  const borderClass = lessonMeta?.isContinuation ? 'border-b border-gray-100/30' : 'border-b border-gray-100'
  const tooltip = lessonMeta
    ? `${lessonMeta.displayLabel} ${lessonMeta.startTime}~${lessonMeta.endTime}`
    : (label ?? status)

  return (
    <div
      className={`h-6 w-full ${borderClass} ${STATUS_STYLES[status]} overflow-hidden`}
      title={tooltip}
    >
      {lessonMeta?.isStart && lessonMeta.displayLabel && (
        <span className="block text-[8px] leading-[24px] text-white font-semibold text-center truncate px-px">
          {lessonMeta.displayLabel}
        </span>
      )}
    </div>
  )
}
