import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { getDateKey } from '../../utils/format'

interface PaymentModalProps {
  studentId: string
  studentName: string
  month: string
  outstandingAmount: number
  onSubmit: (data: { studentId: string; month: string; amount: number; date: string; memo?: string }) => void
  onClose: () => void
}

export function PaymentModal({
  studentId,
  studentName,
  month,
  outstandingAmount,
  onSubmit,
  onClose,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(String(outstandingAmount > 0 ? outstandingAmount : ''))
  const [date, setDate] = useState(getDateKey(new Date()))
  const [memo, setMemo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount)
    if (num <= 0) return
    onSubmit({
      studentId,
      month,
      amount: num,
      date,
      memo: memo.trim() || undefined,
    })
  }

  return (
    <Modal title={`${studentName} 결제 등록`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            결제 금액 (원)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">결제일</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="메모 (선택)"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={Number(amount) <= 0}
            className="flex-1 py-2.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 min-h-[44px]"
          >
            등록
          </button>
        </div>
      </form>
    </Modal>
  )
}
