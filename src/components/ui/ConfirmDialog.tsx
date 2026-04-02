interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = '삭제',
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 min-h-[44px]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
