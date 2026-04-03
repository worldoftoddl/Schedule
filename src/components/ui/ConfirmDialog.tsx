interface ConfirmDialogProps {
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  extraAction?: {
    label: string
    onClick: () => void
  }
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '삭제',
  extraAction,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        {title && <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>}
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex flex-col gap-2">
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
          {extraAction && (
            <button
              onClick={extraAction.onClick}
              className="w-full py-2.5 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200 min-h-[44px]"
            >
              {extraAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
